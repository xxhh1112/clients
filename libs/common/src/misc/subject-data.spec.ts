import { SubjectData } from "./subject-data";

describe("Subject Data", () => {
  it("should create a hash", () => {
    expect(SubjectData.loading({ a: 1 }).hash).toBeDefined();
    expect(SubjectData.loading({ a: 1 }).hash).not.toEqual("");
    expect(SubjectData.loading({ a: 1 }).hash).not.toEqual("undefined");
    expect(SubjectData.loading({ a: 1 }).hash).toEqual(SubjectData.loading({ a: 1 }).hash);
  });

  it("should hash its data", () => {
    expect(SubjectData.loading({ a: 1 }).hash).toEqual(SubjectData.loading({ a: 1 }).hash);
    expect(SubjectData.loading({ a: 1 }).hash).not.toEqual(SubjectData.loading({ a: 2 }).hash);
  });

  it("should include loaded in the hash", () => {
    expect(SubjectData.loading({ a: 1 }).hash).not.toEqual(SubjectData.loaded({ a: 1 }).hash);
  });

  it("should update", () => {
    const subjectData = SubjectData.loading({ a: 1 });
    subjectData.update({ a: 2 });
    expect(subjectData.hash).toEqual(SubjectData.loading({ a: 2 }).hash);
  });

  it("should update loaded", () => {
    const subjectData = SubjectData.loading({ a: 1 });
    subjectData.update({ a: 2 }, true);
    expect(subjectData.hash).toEqual(SubjectData.loaded({ a: 2 }).hash);
  });

  it("should serialize", () => {
    const subjectData = SubjectData.loading({ a: 1 });
    expect(subjectData.toJSON()).toEqual({ loaded: false, data: { a: 1 } });
  });

  it("should deserialize", () => {
    const subjectData = SubjectData.fromJSON({ loaded: false, data: { a: "1" } }, (json) => {
      return { a: "used initializer" };
    });
    expect(subjectData.hash).toEqual(SubjectData.loading({ a: "used initializer" }).hash);
  });
});
