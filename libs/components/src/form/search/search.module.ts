import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { SharedModule } from "../../shared";
import { InputModule } from "../input";

import { SearchComponent } from "./search.component";

@NgModule({
  imports: [SharedModule, InputModule, FormsModule],
  declarations: [SearchComponent],
  exports: [SearchComponent],
})
export class SearchModule {}
