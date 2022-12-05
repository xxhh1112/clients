import { ClearClipboard, clearClipboardAlarmName } from "../clipboard";
import { uploadEventAlarmName, UploadEventsTask } from "../tasks/upload-events-tasks";

import { alarmKeys, clearAlarmTime, getAlarmTime } from "./alarm-state";

export const onAlarmListener = async (alarm: chrome.alarms.Alarm) => {
  alarmKeys.forEach(async (key) => {
    const executionTime = await getAlarmTime(key);
    if (!executionTime) {
      return;
    }

    const currentDate = Date.now();
    if (executionTime > currentDate) {
      return;
    }

    await clearAlarmTime(key);

    switch (key) {
      case clearClipboardAlarmName:
        ClearClipboard.run();
        break;
      case uploadEventAlarmName:
        UploadEventsTask.run();
        break;
      default:
    }
  });
};
