import * as React from "react"
import { Controller, ControllerProps, FieldPath, FieldValues } from "react-hook-form"

import { Form } from "./form-provider"
import { FormFieldContext } from "./form-context"
import { FormItem } from "./form-item"
import { FormLabel } from "./form-label"
import { FormControl } from "./form-control"
import { FormDescription } from "./form-description"
import { FormMessage } from "./form-message"

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};
