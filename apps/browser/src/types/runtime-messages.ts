export type RuntimeMessage = BackgroundCollectPageDetails;

type RuntimeMessageBase<T extends string> = {
  command: T;
};

type BackgroundCollectPageDetails = RuntimeMessageBase<"bgCollectPageDetails"> & { sender: string };
