import { Pipe, PipeTransform } from "@angular/core";

/**
 * Memoize a pure function to prevent unneccesary recalculations during change detection.
 *
 * ```ts
 *  const add = (x, y) => x + y;
 * ```
 *
 * <br></br>
 *
 * ```html
 *  <div>{{ add | memo: [1, 2] }}</div>
 * ```
 */
@Pipe({ name: "memo", standalone: true })
export class MemoPipe implements PipeTransform {
  transform<T extends (...args: any[]) => any>(fn: T, [...args]: [...Parameters<T>]) {
    return fn(...args);
  }
}
