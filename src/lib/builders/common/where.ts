import { Whereable as W } from "zapatos/schema";
import { conditions } from "zapatos/db";

export class WhereableStatement<Whereable extends W> {
  protected _whereable: Whereable = {} as Whereable;

  whereIn<ColumnName extends keyof Whereable>(column: ColumnName, values: Whereable[ColumnName][]): this {
    this._whereable[column] = conditions.isIn(values) as any;
    return this;
  }

  where(callback: (builder: WhereableStatement<Whereable>) => WhereableStatement<Whereable>): this {
    const builder = new WhereableStatement<Whereable>();
    const configured = callback(builder);
    return this.mergeIntoThis(configured);
  }

  private mergeIntoThis(newBuilder: WhereableStatement<Whereable>): this {
    this._whereable = {
      ...this._whereable,
      ...newBuilder._whereable,
    }
    return this;
  }
}
