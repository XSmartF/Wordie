import * as React from "react";
import type { DateRange } from "react-day-picker";
import { endOfDay, startOfDay } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ComboBox } from "@/shared/components/combobox";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import type { FilterFieldConfig } from "@/shared/components/data-table";
import type { FilterRule, FilterType } from "@/shared/types/pagination";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterRule[]) => void;
  fields: FilterFieldConfig[];
  appliedFilters?: FilterRule[];
}

type FieldValue =
  | string
  | string[]
  | { min?: string; max?: string }
  | { from?: string; to?: string };

const defaultOperatorByType: Record<FilterType, FilterRule["Operator"]> = {
  Text: "Contains",
  Number: "Equal",
  Date: "Equal",
  Enum: "Equal",
  MultiSelect: "Include",
  Range: "Between",
  DateRange: "Between",
};

export function FilterPanel({ open, onClose, onApply, fields, appliedFilters }: FilterPanelProps) {
  const [fieldValues, setFieldValues] = React.useState<Record<string, FieldValue>>({});

  React.useEffect(() => {
    if (!open) return;

    if (!appliedFilters || appliedFilters.length === 0) {
      setFieldValues((previous) => (Object.keys(previous).length === 0 ? previous : {}));
      return;
    }

    const nextValues: Record<string, FieldValue> = {};

    appliedFilters.forEach((filter) => {
      const field = filter.Field;
      const config = fields.find((item) => item.field === field);
      if (!config) return;

      switch (config.type) {
        case "MultiSelect":
          if (Array.isArray(filter.Value)) {
            nextValues[field] = filter.Value as string[];
          }
          break;
        case "Range":
          if (
            filter.Value &&
            typeof filter.Value === "object" &&
            !Array.isArray(filter.Value) &&
            ("Min" in (filter.Value as Record<string, unknown>) ||
              "Max" in (filter.Value as Record<string, unknown>))
          ) {
            const valueObject = filter.Value as Record<string, unknown>;
            nextValues[field] = {
              min: valueObject.Min ? String(valueObject.Min) : "",
              max: valueObject.Max ? String(valueObject.Max) : "",
            };
          }
          break;
        case "DateRange":
          if (
            filter.Value &&
            typeof filter.Value === "object" &&
            !Array.isArray(filter.Value)
          ) {
            const valueObject = filter.Value as Record<string, unknown>;
            const minValue = (valueObject.Min ?? valueObject.min) as string | undefined;
            const maxValue = (valueObject.Max ?? valueObject.max) as string | undefined;
            nextValues[field] = {
              from: minValue ?? "",
              to: maxValue ?? "",
            };
          }
          break;
        case "Date":
          if (typeof filter.Value === "string") {
            nextValues[field] = filter.Value.slice(0, 10);
          }
          break;
        default:
          if (filter.Value !== undefined && filter.Value !== null) {
            nextValues[field] = String(filter.Value);
          }
          break;
      }
    });

    setFieldValues(nextValues);
  }, [appliedFilters, fields, open]);

  const updateField = (field: string, value?: FieldValue) => {
    setFieldValues((previous) => {
      if (value === undefined || (typeof value === "string" && value.trim() === "")) {
        const next = { ...previous };
        delete next[field];
        return next;
      }
      return { ...previous, [field]: value };
    });
  };

  const handleEnumChange = (field: string, value: string) => {
    if (!value) {
      updateField(field, undefined);
      return;
    }

    updateField(field, value);
  };

  const handleMultiSelectToggle = (field: string, optionValue: string, checked: boolean) => {
    setFieldValues((previous) => {
      const current = Array.isArray(previous[field]) ? (previous[field] as string[]) : [];
      const next = checked
        ? Array.from(new Set([...current, optionValue]))
        : current.filter((item) => item !== optionValue);

      if (next.length === 0) {
        const rest = { ...previous };
        delete rest[field];
        return rest;
      }

      return { ...previous, [field]: next };
    });
  };

  const handleRangeChange = (field: string, bound: "min" | "max", value: string) => {
    setFieldValues((previous) => {
      const current = previous[field];
      const nextRange: { min?: string; max?: string } =
        current && typeof current === "object" && !Array.isArray(current)
          ? { ...(current as { min?: string; max?: string }) }
          : {};

      if (value === "") {
        delete nextRange[bound];
      } else {
        nextRange[bound] = value;
      }

      if (!nextRange.min && !nextRange.max) {
        const rest = { ...previous };
        delete rest[field];
        return rest;
      }

      return { ...previous, [field]: nextRange };
    });
  };

  const handleDateRangeChange = (field: string, range: DateRange | undefined) => {
    setFieldValues((previous) => {
      if (!range || (!range.from && !range.to)) {
        const next = { ...previous };
        delete next[field];
        return next;
      }

      const next = { ...previous };
      next[field] = {
        from: range.from ? startOfDay(range.from).toISOString() : undefined,
        to: range.to ? endOfDay(range.to).toISOString() : undefined,
      };
      return next;
    });
  };

  const buildRule = (config: FilterFieldConfig, rawValue: FieldValue | undefined): FilterRule | undefined => {
    if (rawValue === undefined) return undefined;
    const operator = config.operator ?? defaultOperatorByType[config.type];

    switch (config.type) {
      case "Text": {
        if (typeof rawValue !== "string" || rawValue.trim() === "") return undefined;
        return {
          Field: config.field,
          Type: "Text",
          Operator: operator,
          Value: rawValue.trim(),
        };
      }
      case "Number": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined;
        const numeric = Number(rawValue);
        if (Number.isNaN(numeric)) return undefined;
        return {
          Field: config.field,
          Type: "Number",
          Operator: operator,
          Value: numeric,
        };
      }
      case "Date": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined;
        return {
          Field: config.field,
          Type: "Date",
          Operator: operator,
          Value: new Date(`${rawValue}T00:00:00.000Z`).toISOString(),
        };
      }
      case "Enum": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined;
        return {
          Field: config.field,
          Type: "Enum",
          Operator: operator,
          Value: rawValue,
        };
      }
      case "MultiSelect": {
        if (!Array.isArray(rawValue) || rawValue.length === 0) return undefined;
        return {
          Field: config.field,
          Type: "MultiSelect",
          Operator: operator,
          Value: rawValue,
        };
      }
      case "Range": {
        if (
          !rawValue ||
          typeof rawValue !== "object" ||
          Array.isArray(rawValue)
        ) {
          return undefined;
        }

        const { min, max } = rawValue as { min?: string; max?: string };
        if (min === undefined && max === undefined) return undefined;

        const result: { Min?: number; Max?: number } = {};

        if (min !== undefined && min !== "") {
          const numericMin = Number(min);
          if (!Number.isNaN(numericMin)) {
            result.Min = numericMin;
          }
        }

        if (max !== undefined && max !== "") {
          const numericMax = Number(max);
          if (!Number.isNaN(numericMax)) {
            result.Max = numericMax;
          }
        }

        if (result.Min === undefined && result.Max === undefined) return undefined;

        return {
          Field: config.field,
          Type: "Range",
          Operator: operator,
          Value: result,
        };
      }
      case "DateRange": {
        if (
          !rawValue ||
          typeof rawValue !== "object" ||
          Array.isArray(rawValue)
        ) {
          return undefined;
        }

        const { from, to } = rawValue as { from?: string; to?: string };
        if (!from && !to) return undefined;

        const result: { Min?: string; Max?: string } = {};

        if (from) {
          result.Min = new Date(from).toISOString();
        }

        if (to) {
          result.Max = new Date(to).toISOString();
        }

        if (!result.Min && !result.Max) return undefined;

        return {
          Field: config.field,
          Type: "DateRange",
          Operator: operator,
          Value: result,
        };
      }
      default:
        return undefined;
    }
  };

  const handleApply = () => {
    const filters: FilterRule[] = [];

    fields.forEach((config) => {
      const rawValue = fieldValues[config.field];
      const rule = buildRule(config, rawValue);
      if (rule) {
        filters.push(rule);
      }
    });

    onApply(filters);
  };

  const handleReset = () => {
    setFieldValues({});
    onApply([]);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[320px] max-w-full space-y-6 p-6 sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Bộ lọc</SheetTitle>
          <SheetDescription>Tùy chỉnh bộ lọc để thu hẹp kết quả</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5">
          {fields.map((fieldConfig) => {
            const fieldLabel = fieldConfig.label ?? fieldConfig.field;
            const controlId = `${fieldConfig.field}-filter`;
            const currentValue = fieldValues[fieldConfig.field];

            switch (fieldConfig.type) {
              case "Number":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      type="number"
                      placeholder={fieldConfig.placeholder ?? `Nhập ${fieldLabel}`}
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => updateField(fieldConfig.field, event.target.value)}
                    />
                  </div>
                );
              case "Date":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      type="date"
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => updateField(fieldConfig.field, event.target.value)}
                    />
                  </div>
                );
              case "DateRange": {
                const rangeValue: DateRange | undefined =
                  currentValue &&
                  typeof currentValue === "object" &&
                  !Array.isArray(currentValue)
                    ? {
                        from: (currentValue as { from?: string }).from
                          ? new Date((currentValue as { from?: string }).from as string)
                          : undefined,
                        to: (currentValue as { to?: string }).to
                          ? new Date((currentValue as { to?: string }).to as string)
                          : undefined,
                      }
                    : undefined;

                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <DateRangePicker
                      value={rangeValue}
                      onChange={(nextRange) => handleDateRangeChange(fieldConfig.field, nextRange)}
                      className="h-9"
                      monthCount={1}
                    />
                  </div>
                );
              }
              case "Enum": {
                const comboItems = fieldConfig.options ?? [];
                const comboValue = typeof currentValue === "string" ? currentValue : "";

                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <ComboBox
                      id={controlId}
                      items={comboItems}
                      value={comboValue}
                      onChange={(value) => {
                        handleEnumChange(fieldConfig.field, value);
                      }}
                      placeholder={fieldConfig.placeholder ?? `Chọn ${fieldLabel}`}
                    />
                  </div>
                );
              }
              case "MultiSelect":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <div className="grid gap-2">
                      {fieldConfig.options?.map((option) => {
                        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
                        const checked = selectedValues.includes(option.value);

                        return (
                          <label key={option.value} className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                handleMultiSelectToggle(fieldConfig.field, option.value, value === true)
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              case "Range":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={
                          currentValue &&
                          typeof currentValue === "object" &&
                          !Array.isArray(currentValue) &&
                          "min" in currentValue
                            ? (currentValue as { min?: string }).min ?? ""
                            : ""
                        }
                        onChange={(event) => handleRangeChange(fieldConfig.field, "min", event.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={
                          currentValue &&
                          typeof currentValue === "object" &&
                          !Array.isArray(currentValue) &&
                          "max" in currentValue
                            ? (currentValue as { max?: string }).max ?? ""
                            : ""
                        }
                        onChange={(event) => handleRangeChange(fieldConfig.field, "max", event.target.value)}
                      />
                    </div>
                  </div>
                );
              default:
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      placeholder={fieldConfig.placeholder ?? `Nhập ${fieldLabel}`}
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => updateField(fieldConfig.field, event.target.value)}
                    />
                  </div>
                );
            }
          })}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            Xóa bộ lọc
          </Button>
          <Button onClick={handleApply}>Áp dụng</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
