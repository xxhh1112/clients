import { Pipe, PipeTransform } from "@angular/core";

/**
 * Given a range [1, 5] --> [1, 2, 3, 4, 5]
 *
 * Given a range [5, 1, -1] --> [5, 4, 3, 2, 1]
 *
 * ```html
 *  <div *ngFor="let n of [1,5] | range"></div>
 * ```
 */
@Pipe({ name: "range", standalone: true })
export class RangePipe implements PipeTransform {
  transform([start, stop, step = 1]: [number, number, number?]): number[] {
    return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
  }
}
