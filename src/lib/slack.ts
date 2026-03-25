import { WebClient } from "@slack/web-api";
import { prisma } from "./db";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  files?: SlackFile[];
  reactions?: SlackReaction[];
  thread_ts?: string;
  permalink?: string;
}

export interface SlackFile {
  id: string;
  url_private: string;
  thumb_720?: string;
  thumb_480?: string;
  thumb_360?: string;
  thumb_video?: string;
  mimetype: string;
  name: string;
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export async function fetchChannelMessages(
  channelId: string
): Promise<SlackMessage[]> {
  const allMessages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const result = await slack.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
    });

    if (result.messages) {
      for (const msg of result.messages) {
        allMessages.push(msg as unknown as SlackMessage);

        if (msg.reply_count && msg.reply_count > 0) {
          const threadMessages = await fetchThreadReplies(
            channelId,
            msg.ts as string
          );
          allMessages.push(...threadMessages);
        }
      }
    }

    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  return allMessages;
}

async function fetchThreadReplies(
  channelId: string,
  threadTs: string
): Promise<SlackMessage[]> {
  const replies: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const result = await slack.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit: 200,
      cursor,
    });

    if (result.messages) {
      // Skip the parent message (first one)
      const threadReplies = result.messages.slice(1);
      replies.push(...(threadReplies as unknown as SlackMessage[]));
    }

    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  return replies;
}

export async function getMessagePermalink(
  channelId: string,
  messageTs: string
): Promise<string | null> {
  try {
    const result = await slack.chat.getPermalink({
      channel: channelId,
      message_ts: messageTs,
    });
    return result.permalink || null;
  } catch {
    return null;
  }
}

export async function getMessageReactions(
  channelId: string,
  messageTs: string
): Promise<SlackReaction[]> {
  try {
    const result = await slack.reactions.get({
      channel: channelId,
      timestamp: messageTs,
      full: true,
    });
    return (result.message?.reactions as unknown as SlackReaction[]) || [];
  } catch {
    return [];
  }
}

export async function getUserInfo(
  slackUserId: string
): Promise<{ displayName: string; realName: string; avatarUrl: string } | null> {
  try {
    const result = await slack.users.info({ user: slackUserId });
    if (!result.user) return null;

    return {
      displayName:
        result.user.profile?.display_name ||
        result.user.real_name ||
        result.user.name ||
        "Unknown",
      realName: result.user.real_name || result.user.name || "Unknown",
      avatarUrl: result.user.profile?.image_72 || "",
    };
  } catch {
    return null;
  }
}

export async function syncSlackChannel(channelId: string) {
  const syncLog = await prisma.syncLog.create({
    data: { status: "IN_PROGRESS" },
  });

  const startTime = Date.now();
  let messagesProcessed = 0;
  let photosFound = 0;
  let newPhotos = 0;
  let reactionsUpdated = 0;
  const errors: string[] = [];

  try {
    const messages = await fetchChannelMessages(channelId);
    messagesProcessed = messages.length;

    for (const msg of messages) {
      try {
        if (!msg.files || msg.files.length === 0) continue;

        const mediaFiles = msg.files.filter(
          (f) =>
            f.mimetype?.startsWith("image/") ||
            f.mimetype?.startsWith("video/")
        );
        if (mediaFiles.length === 0) continue;

        photosFound += mediaFiles.length;

        let user = await prisma.user.findUnique({
          where: { slackId: msg.user },
        });

        if (!user) {
          const userInfo = await getUserInfo(msg.user);
          user = await prisma.user.create({
            data: {
              slackId: msg.user,
              displayName: userInfo?.displayName || "Unknown User",
              realName: userInfo?.realName,
              avatarUrl: userInfo?.avatarUrl,
            },
          });
        }

        let slackPost = await prisma.slackPost.findUnique({
          where: { slackMessageTs: msg.ts },
        });

        const permalink = await getMessagePermalink(channelId, msg.ts);
        const postedAt = new Date(parseFloat(msg.ts) * 1000);

        if (!slackPost) {
          slackPost = await prisma.slackPost.create({
            data: {
              slackMessageTs: msg.ts,
              channelId,
              threadTs: msg.thread_ts,
              userId: user.id,
              caption: msg.text || null,
              slackPermalink: permalink,
              postedAt,
              rawText: msg.text,
            },
          });
        } else {
          slackPost = await prisma.slackPost.update({
            where: { id: slackPost.id },
            data: {
              caption: msg.text || slackPost.caption,
              slackPermalink: permalink || slackPost.slackPermalink,
            },
          });
        }

        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const existingEntry = await prisma.photoEntry.findFirst({
            where: {
              slackPostId: slackPost.id,
              imageIndex: i,
            },
          });

          let entryId: string;

          if (!existingEntry) {
            const mediaType = file.mimetype?.startsWith("video/")
              ? "video"
              : "image";
            const thumbnail =
              file.thumb_video ||
              file.thumb_720 ||
              file.thumb_480 ||
              file.thumb_360 ||
              null;
            const entry = await prisma.photoEntry.create({
              data: {
                slackPostId: slackPost.id,
                imageUrl: file.url_private,
                thumbnailUrl: thumbnail,
                mediaType,
                imageIndex: i,
                caption: msg.text || null,
              },
            });
            entryId = entry.id;
            newPhotos++;
          } else {
            entryId = existingEntry.id;
            await prisma.photoEntry.update({
              where: { id: entryId },
              data: {
                imageUrl: file.url_private,
                thumbnailUrl:
                  file.thumb_video ||
                  file.thumb_720 ||
                  file.thumb_480 ||
                  file.thumb_360 ||
                  existingEntry.thumbnailUrl,
              },
            });
          }

          const reactions = await getMessageReactions(channelId, msg.ts);
          for (const reaction of reactions) {
            for (const reactUserId of reaction.users) {
              let reactUser = await prisma.user.findUnique({
                where: { slackId: reactUserId },
              });
              if (!reactUser) {
                const reactUserInfo = await getUserInfo(reactUserId);
                reactUser = await prisma.user.create({
                  data: {
                    slackId: reactUserId,
                    displayName:
                      reactUserInfo?.displayName || "Unknown User",
                    realName: reactUserInfo?.realName,
                    avatarUrl: reactUserInfo?.avatarUrl,
                  },
                });
              }

              await prisma.reaction.upsert({
                where: {
                  photoEntryId_slackUserId_emoji: {
                    photoEntryId: entryId,
                    slackUserId: reactUserId,
                    emoji: reaction.name,
                  },
                },
                create: {
                  photoEntryId: entryId,
                  slackUserId: reactUserId,
                  emoji: reaction.name,
                },
                update: {},
              });
              reactionsUpdated++;

              await prisma.uniqueVote.upsert({
                where: {
                  photoEntryId_slackUserId: {
                    photoEntryId: entryId,
                    slackUserId: reactUserId,
                  },
                },
                create: {
                  photoEntryId: entryId,
                  slackUserId: reactUserId,
                },
                update: {},
              });
            }
          }
        }
      } catch (msgError) {
        errors.push(
          `Error processing message ${msg.ts}: ${msgError instanceof Error ? msgError.message : "Unknown error"}`
        );
      }
    }

    const duration = Date.now() - startTime;
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        messagesProcessed,
        photosFound,
        newPhotos,
        reactionsUpdated,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        duration,
      },
    });

    return {
      status: "SUCCESS",
      messagesProcessed,
      photosFound,
      newPhotos,
      reactionsUpdated,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        messagesProcessed,
        photosFound,
        newPhotos,
        reactionsUpdated,
        errors: JSON.stringify([
          ...errors,
          error instanceof Error ? error.message : "Unknown error",
        ]),
        duration,
      },
    });

    throw error;
  }
}
