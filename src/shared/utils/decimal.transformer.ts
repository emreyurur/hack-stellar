import { ValueTransformer } from "typeorm";

export const decimalTransformer: ValueTransformer = {
  to: (value: any) => {
    if (value === null || value === undefined) {
      return value;
    }
    return value.toString();
  },
  from: (value: any) => {
    if (value === null || value === undefined) {
      return value;
    }
    return parseFloat(value);
  },
};
