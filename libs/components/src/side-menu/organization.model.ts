import { Item } from "./item.model";
import { RouteLink } from "./route.type";

export interface Organization {
  name: string;
  route: RouteLink;
  collections: Item[];
}
