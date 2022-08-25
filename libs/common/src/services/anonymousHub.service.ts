import { Injectable } from "@angular/core";
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  IHubProtocol,
} from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";

import { AnonymousHubService as AnonymousHubServiceAbstraction } from "../abstractions/anonymousHub.service";
import { AuthService } from "../abstractions/auth.service";
import { EnvironmentService } from "../abstractions/environment.service";
import { LogService } from "../abstractions/log.service";

import {
  AuthRequestPushNotification,
  NotificationResponse,
} from "./../models/response/notificationResponse";

@Injectable()
export class AnonymousHubService implements AnonymousHubServiceAbstraction {
  private hubConnection: HubConnection;
  private url: string;

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private logService: LogService
  ) {}

  async createHubConnection(token: string) {
    this.url = this.environmentService.getNotificationsUrl();

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.url + "/anonymousHub?Token=" + token, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withHubProtocol(new MessagePackHubProtocol() as IHubProtocol)
      .build();

    this.hubConnection.start().catch((error) => this.logService.error(error));

    this.hubConnection.on("AuthRequestResponseRecieved", (data: any) => {
      this.ProcessNotification(new NotificationResponse(data));
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  private async ProcessNotification(notification: NotificationResponse) {
    await this.authService.authResponsePushNotifiction(
      notification.payload as AuthRequestPushNotification
    );
  }
}
