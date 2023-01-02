import * as objectHash from "object-hash";
import { Jsonify } from "type-fest";

export class SubjectData<T> {
  loaded = false;
  get hash(): string {
    return objectHash(this.toJSON());
  }

  private constructor(public data: T) {}

  update(data: T, loaded: boolean | null = null): SubjectData<T> {
    this.data = data;
    if (loaded !== null) {
      this.loaded = loaded;
    }
    return this;
  }

  toJSON() {
    return {
      loaded: this.loaded,
      data: this.data,
    };
  }

  static loading<T>(data: T): SubjectData<T> {
    const subjectData = new SubjectData(data);
    subjectData.loaded = false;
    return subjectData;
  }

  static loaded<T>(data: T): SubjectData<T> {
    const subjectData = new SubjectData(data);
    subjectData.loaded = true;
    return subjectData;
  }

  static fromJSON<T>(
    json: Jsonify<SubjectData<T>>,
    initializer: (json: Jsonify<T>) => T
  ): SubjectData<T> {
    return new SubjectData(initializer(json.data as Jsonify<T>));
  }
}
