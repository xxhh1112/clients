import { CachedServices } from "../background/service_factories/factory-options";

import { UploadEventsTask } from "./upload-events-tasks";

export function registerTasks() {
  const serviceCache: CachedServices = {};

  UploadEventsTask.run(serviceCache);
}
