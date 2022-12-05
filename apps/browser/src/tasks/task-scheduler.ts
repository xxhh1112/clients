import { UploadEventsTask } from "./upload-events-tasks";

export function registerTasks() {
  UploadEventsTask.run();
}
