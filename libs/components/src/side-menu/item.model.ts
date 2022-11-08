import { RouteLink } from "./route.type";

export interface Item {
  name: string;
  route: RouteLink;
  children: Item[];
}
