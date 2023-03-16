import { Opaque } from "type-fest";

type StorageKey = Opaque<string, "StorageKey">;

type StorageLocation = "disk" | "secure" | "memory";
