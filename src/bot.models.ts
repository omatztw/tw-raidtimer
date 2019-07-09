export class Bot {
  private API_BASE = 'https://discordapp.com/api/v6';
  private token: string;
  private channelId: string;

  constructor(token: string, channelId: string) {
    this.token = token;
    this.channelId = channelId;
  }

  public getMessages(): Message[] {
    const url = this.API_BASE + '/channels/' + this.channelId + '/messages';

    const options = {
      method: 'get',
      headers: {
        Authorization: 'Bot ' + this.token
      }
    };

    const resp = UrlFetchApp.fetch(url, options as GoogleAppsScript.URL_Fetch.URLFetchRequestOptions);
    const messages: Message[] = JSON.parse(resp.getContentText());
    return messages;
  }

  public deleteBulkMessages(messageIds: string[]) {
    let ids = messageIds;
    const DEL_MAX = 100;
    const DEL_MIN = 2;

    if (messageIds.length < DEL_MIN) {
      return;
    }

    if (messageIds.length > DEL_MAX) {
      ids = messageIds.slice(0, DEL_MAX);
    }

    const url = this.API_BASE + '/channels/' + this.channelId + '/messages/bulk-delete';

    const payload = {
      messages: ids
    };

    const options = {
      method: 'post',
      headers: {
        Authorization: 'Bot ' + this.token,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };

    UrlFetchApp.fetch(url, options as GoogleAppsScript.URL_Fetch.URLFetchRequestOptions);
  }
}

export interface Message {
  attachments: any[];
  tts: boolean;
  embeds: any[];
  timestamp: string;
  mention_everyone: boolean;
  webhook_id: string;
  id: string;
  pinned: boolean;
  edited_timestamp: string;
  author: Author;
  mention_roles: any[];
  content: string;
  channel_id: string;
  mentions: any[];
  type: number;
}

interface Author {
  username: string;
  discriminator: string;
  bot: boolean;
  id: string;
  avatar: string;
}
