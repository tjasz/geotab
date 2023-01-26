import { setEquals } from './algorithm'
import { DataContextType } from './dataContext';
import { FieldType } from './fieldtype'

type ParameterSpec = {[index:string] : {type: FieldType}}
type ParameterDef = {[index:string] : any}

export enum FilterType {
  Condition = "Condition",
  ConditionGroup = "ConditionGroup",
}

export enum ConditionGroupOperator {
  AND = "and",
  OR = "or",
}

// TODO location-based conditions (ex: WithinRange)
// TODO multi-field formula conditions (ex: prominence > 0.1 * elevation)
export enum ConditionOperator {
  IsEmpty = "IsEmpty",
  IsNotEmpty = "IsNotEmpty",
  EqualTo = "EqualTo",
  NotEqualTo = "NotEqualTo",
  GreaterThan = "GreaterThan",
  GreaterThanOrEqualTo = "GreaterThanOrEqualTo",
  LessThan = "LessThan",
  LessThanOrEqualTo = "LessThanOrEqualTo",
  Between = "Between",
  NotBetween = "NotBetween",
  In = "In",
  NotIn = "NotIn",
  Contains = "Contains",
  DoesNotContain = "DoesNotContain",
  ContainsAny = "ContainsAny",
  ContainsNone = "ContainsNone",
  StartsWith = "StartsWith",
  DoesNotStartWith = "DoesNotStartWith",
  EndsWith = "EndsWith",
  DoesNotEndWith = "DoesNotEndWith",
  Like = "Like",
  NotLike = "NotLike",
  OnDayOfWeek = "OnDayOfWeek",
  OnDayOfMonth = "OnDayOfMonth",
  OnDayOfYear = "OnDayOfYear",
  OnDayMonthOfYear = "OnDayMonthOfYear",
  InWeekOfMonth = "InWeekOfMonth",
  InWeekOfYear = "InWeekOfYear",
  InMonthOfYear = "InMonthOfYear",
  InYear = "InYear",
};

export class Condition {
  type: FilterType;
  operator: ConditionOperator;
  operandType: FieldType;
  fieldname: string;
  parameters: ParameterDef;
  negate: boolean;

  constructor(operator:ConditionOperator, operandType:FieldType, fieldname:string, parameters:ParameterDef, negate:boolean=false) {
    this.type = FilterType.Condition;
    this.operator = operator;
    this.operandType = operandType
    if (!Object.values(ConditionOperator).includes(this.operator)) {
      throw Error(`Condition.operator: Found ${this.operator}. Expected one of ${Object.values(ConditionOperator)}.`);
    }
    // TODO should have this.dataType? support string, numeric, datetime for basic operators
    this.fieldname = fieldname;
    // TODO verify fieldname is in data table and of correct type
    this.parameters = parameters;
    if (!setEquals(Object.keys(this.parameters), Object.keys(parametersMap[this.operator]))) {
      throw Error(`Condition.parameters: Found ${JSON.stringify(this.parameters)}. Expected keys ${Object.keys(parametersMap[this.operator])}.`);
    }
    // TODO ensure parameters are of correct dataType?
    this.negate = negate;
    if (this.negate !== true && this.negate !== false) {
      throw Error(`Condition.negate: Found ${this.negate}. Expected true or false.`);
    }
  }
}

export class ConditionGroup {
  type: FilterType;
  operator: ConditionGroupOperator;
  conditions: (Condition|ConditionGroup)[];

  constructor(operator:ConditionGroupOperator, conditions:Condition[]) {
    this.type = FilterType.ConditionGroup;
    this.operator = operator;
    this.conditions = conditions;
    if (!Object.values(ConditionGroupOperator).includes(this.operator)) {
      throw Error(`ConditionGroup.operator: Found ${this.operator}. Expected one of ${Object.values(ConditionGroupOperator)}.`);
    }
  }
}

export const operandTypes : {[key in ConditionOperator]: FieldType} = {
  [ConditionOperator.IsEmpty]: FieldType.String,
  [ConditionOperator.IsNotEmpty]: FieldType.String,
  [ConditionOperator.EqualTo]: FieldType.Any,
  [ConditionOperator.NotEqualTo]: FieldType.Any,
  [ConditionOperator.GreaterThan]: FieldType.Any,
  [ConditionOperator.GreaterThanOrEqualTo]: FieldType.Any,
  [ConditionOperator.LessThan]: FieldType.Any,
  [ConditionOperator.LessThanOrEqualTo]: FieldType.Any,
  [ConditionOperator.Between]: FieldType.Any,
  [ConditionOperator.NotBetween]: FieldType.Any,
  [ConditionOperator.In]: FieldType.Any,
  [ConditionOperator.NotIn]: FieldType.Any,
  [ConditionOperator.Contains]: FieldType.String,
  [ConditionOperator.DoesNotContain]: FieldType.String,
  [ConditionOperator.ContainsAny]: FieldType.String,
  [ConditionOperator.ContainsNone]: FieldType.String,
  [ConditionOperator.StartsWith]: FieldType.String,
  [ConditionOperator.DoesNotStartWith]: FieldType.String,
  [ConditionOperator.EndsWith]: FieldType.String,
  [ConditionOperator.DoesNotEndWith]: FieldType.String,
  [ConditionOperator.Like]: FieldType.String,
  [ConditionOperator.NotLike]: FieldType.String,
  [ConditionOperator.OnDayOfWeek]: FieldType.Date,
  [ConditionOperator.OnDayOfMonth]: FieldType.Date,
  [ConditionOperator.OnDayOfYear]: FieldType.Date,
  [ConditionOperator.OnDayMonthOfYear]: FieldType.Date,
  [ConditionOperator.InWeekOfMonth]: FieldType.Date,
  [ConditionOperator.InWeekOfYear]: FieldType.Date,
  [ConditionOperator.InMonthOfYear]: FieldType.Date,
  [ConditionOperator.InYear]: FieldType.Date,
};

export const parametersMap : {[key in ConditionOperator]: ParameterSpec} = {
  [ConditionOperator.IsEmpty]: {},
  [ConditionOperator.IsNotEmpty]: {},
  [ConditionOperator.EqualTo]: {value: {type: FieldType.Any}},
  [ConditionOperator.NotEqualTo]: {value: {type: FieldType.Any}},
  [ConditionOperator.GreaterThan]: {value: {type: FieldType.Any}},
  [ConditionOperator.GreaterThanOrEqualTo]: {value: {type: FieldType.Any}},
  [ConditionOperator.LessThan]: {value: {type: FieldType.Any}},
  [ConditionOperator.LessThanOrEqualTo]: {value: {type: FieldType.Any}},
  [ConditionOperator.Between]: {min: {type: FieldType.Any}, max: {type: FieldType.Any}},
  [ConditionOperator.NotBetween]: {min: {type: FieldType.Any}, max: {type: FieldType.Any}},
  [ConditionOperator.In]: {values: {type: FieldType.Any}}, // TODO set(auto)
  [ConditionOperator.NotIn]: {values: {type: FieldType.Any}}, // TODO set(auto)
  [ConditionOperator.Contains]: {substring: {type: FieldType.String}},
  [ConditionOperator.DoesNotContain]: {substring: {type: FieldType.String}},
  [ConditionOperator.ContainsAny]: {substrings: {type: FieldType.String}}, // TODO set(string)
  [ConditionOperator.ContainsNone]: {substrings: {type: FieldType.String}}, // TODO set(string)
  [ConditionOperator.StartsWith]: {prefix: {type: FieldType.String}},
  [ConditionOperator.DoesNotStartWith]: {prefix: {type: FieldType.String}},
  [ConditionOperator.EndsWith]: {suffix: {type: FieldType.String}},
  [ConditionOperator.DoesNotEndWith]: {suffix: {type: FieldType.String}},
  [ConditionOperator.Like]: {regex: {type: FieldType.String}},
  [ConditionOperator.NotLike]: {regex: {type: FieldType.String}},
  [ConditionOperator.OnDayOfWeek]: {day: {type: FieldType.Number}},
  [ConditionOperator.OnDayOfMonth]: {day: {type: FieldType.Number}},
  [ConditionOperator.OnDayOfYear]: {day: {type: FieldType.Number}},
  [ConditionOperator.OnDayMonthOfYear]: {day: {type: FieldType.Number}, month: {type: FieldType.Number}},
  [ConditionOperator.InWeekOfMonth]: {week: {type: FieldType.Number}},
  [ConditionOperator.InWeekOfYear]: {week: {type: FieldType.Number}},
  [ConditionOperator.InMonthOfYear]: {month: {type: FieldType.Number}},
  [ConditionOperator.InYear]: {year: {type: FieldType.Number}},
};

function conditionGroupEquals(a:ConditionGroup, b:ConditionGroup) : boolean {
  if (a.type !== FilterType.ConditionGroup) {
    throw Error(`Filter.type: Found ${a.type}. Expected 'ConditionGroup'.`);
  }
  if (b.type !== FilterType.ConditionGroup) {
    throw Error(`Filter.type: Found ${b.type}. Expected 'ConditionGroup'.`);
  }
  if (a.operator !== b.operator) return false;
  return a.conditions.every((acondition) => b.conditions.some((bcondition) => filterEquals(acondition, bcondition))) &&
         b.conditions.every((bcondition) => a.conditions.some((acondition) => filterEquals(acondition, bcondition)));
}

function conditionEquals(a:Condition, b:Condition) : boolean {
  if (a.type !== FilterType.Condition) {
    throw Error(`Filter.type: Found ${a.type}. Expected 'Condition'.`);
  }
  if (b.type !== FilterType.Condition) {
    throw Error(`Filter.type: Found ${b.type}. Expected 'Condition'.`);
  }
  if (a.operator !== b.operator) return false;
  if (a.operandType !== b.operandType) return false;
  if (a.fieldname !== b.fieldname) return false;
  if (a.negate !== b.negate) return false;
  return Object.keys(a.parameters).every((key) => a.parameters[key] === b.parameters[key]) &&
         Object.keys(b.parameters).every((key) => a.parameters[key] === b.parameters[key]);
}

export function filterEquals(a:Condition|ConditionGroup, b:Condition|ConditionGroup) : boolean {
  if (a.type !== b.type) return false;
  if (a.operator !== b.operator) return false;
  if (a.type === "ConditionGroup") {
    return conditionGroupEquals(a as ConditionGroup, b as ConditionGroup);
  }
  else if (a.type === "Condition") {
    return conditionEquals(a as Condition, b as Condition);
  }
  throw Error(`Filter.type: Found ${a.type}. Expected 'ConditionGroup' or 'Condition'.`);
}

export const defaultFilter = new ConditionGroup(ConditionGroupOperator.AND, []);

export function evaluateFilter(row, filter:Condition|ConditionGroup) : boolean {
  if (filter === null) {
    return true;
  }
  switch(filter.type) {
    case FilterType.ConditionGroup:
      return evaluateConditionGroup(row, filter as ConditionGroup);
    case FilterType.Condition:
      return evaluateCondition(row, filter as Condition);
    default:
      throw Error(`Filter.type: Found ${filter.type}. Expected 'ConditionGroup' or 'Condition'.`);
  }
}

function evaluateConditionGroup(row, group:ConditionGroup) : boolean {
  switch (group.operator) {
    case ConditionGroupOperator.AND:
      return group.conditions.every((condition) => evaluateFilter(row, condition));
    case ConditionGroupOperator.OR:
      // child can be a condition or another group
      return group.conditions.some((condition) => evaluateFilter(row, condition));
    default:
      throw Error(`ConditionGroup.operator: Found '${group.operator}'. Expected 'and' or 'or'.`);
  }
}

function isEmpty(rowValue) : boolean {
  return rowValue === null || rowValue === undefined || rowValue === "";
}

function equalTo<T>(rowValue:T, value:T) : boolean {
  return rowValue === value;
}

function greaterThan<T>(rowValue:T, value:T) : boolean {
  return rowValue > value;
}

function lessThan<T>(rowValue:T, value:T) : boolean {
  return rowValue < value;
}

function between<T>(rowValue:T, a:T, b:T) : boolean {
  return (rowValue >= a && rowValue <= b) ||
         (rowValue <= a && rowValue >= b);
}

function isIn<T>(rowValue:T, values:T[]) : boolean {
  return values.includes(rowValue);
}

function contains(rowValue:string|undefined, substring:string) : boolean {
  // TODO make case sensitivity a parameter for string operators?
  return rowValue !== undefined && rowValue.toUpperCase().includes(substring.toUpperCase());
}

function startsWith(rowValue:string|undefined, prefix:string) : boolean {
  return rowValue !== undefined && rowValue.toUpperCase().startsWith(prefix.toUpperCase());
}

function endsWith(rowValue:string|undefined, suffix:string) : boolean {
  return rowValue !== undefined && rowValue.toUpperCase().endsWith(suffix.toUpperCase());
}

function like(rowValue:string|undefined, regex:string) : boolean {
  return new RegExp(regex).test(rowValue ?? "");
}

function onDayOfWeek(rowValue:Date, dayOfWeek:number) : boolean {
  // TODO UI should show strings Monday for 1, etc.
  return rowValue.getUTCDay() === (dayOfWeek % 7);
}

function dayOfYear(dt:Date) : number {
  const start = new Date(dt.getFullYear(), 0, 1);
  const diff = (dt.getTime() - start.getTime()) + ((start.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.ceil(diff / oneDay);
  return day;
}

function onDayOfYear(rowValue:Date, dayOfMonth:number) : boolean {
  return dayOfYear(rowValue) === dayOfMonth;
}

function onDayOfMonth(rowValue:Date, dayOfMonth:number) : boolean {
  return rowValue.getUTCDate() === dayOfMonth;
}

function onDayMonthOfYear(rowValue:Date, month:number, dayOfMonth:number) : boolean {
  return rowValue.getUTCMonth() === month-1 && rowValue.getUTCDate() === dayOfMonth;
}

function weekOfMonth(dt:Date) : number {
  // the week of the month is equal to the number of Mondays that have occurred since the month started
  const monthStart = new Date(dt.getFullYear(), dt.getMonth(), 1);
  const firstMonday = new Date(dt.getFullYear(), dt.getMonth(), (9 - monthStart.getDay()) % 7);
  const diff = (dt.getTime() - firstMonday.getTime()) + ((firstMonday.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000);
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.ceil(diff / oneWeek);
  return week;
}

function inWeekOfMonth(rowValue:Date, week:number) : boolean {
  return weekOfMonth(rowValue) === week;
}

function weekOfYear(dt:Date) : number {
  // the week of the year is equal to the number of Mondays that have occurred since the year started
  const yearStart = new Date(dt.getFullYear(), 0, 1);
  const firstMonday = new Date(dt.getFullYear(), 0, (9 - yearStart.getDay()) % 7);
  const diff = (dt.getTime() - firstMonday.getTime()) + ((firstMonday.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000);
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.ceil(diff / oneWeek);
  return week;
}

function inWeekOfYear(rowValue:Date, week:number) : boolean {
  return weekOfYear(rowValue) === week;
}

function inMonthOfYear(rowValue:Date, month:number) : boolean {
  return rowValue.getUTCMonth() === month-1;
}

function inYear(rowValue:Date, year:number) : boolean {
  return rowValue.getUTCFullYear() === year;
}

function evaluateCondition(row, condition:Condition) : boolean {
  let result = true;
  let value = row.properties[condition.fieldname];
  switch (condition.operandType) {
    case "number":
      value = Number(value);
      break;
    case "date":
      value = typeof value === "number" ? value : Date.parse(value);
      value = new Date(value);
      break;
    case "string":
      value = typeof value === "string" ? value : JSON.stringify(value);
      break;
    default:
      break;
  }
  switch (condition.operator) {
    case "IsEmpty":
      result = isEmpty(value);
      break;
    case "IsNotEmpty":
      result = !isEmpty(value);
      break;
    case "EqualTo":
      result = equalTo(value, condition.parameters.value);
      break;
    case "NotEqualTo":
      result = !equalTo(value, condition.parameters.value);
      break;
    case "GreaterThan":
      result = greaterThan(value, condition.parameters.value);
      break;
    case "GreaterThanOrEqualTo":
      result = !lessThan(value, condition.parameters.value);
      break;
    case "LessThan":
      result = lessThan(value, condition.parameters.value);
      break;
    case "LessThanOrEqualTo":
      result = !greaterThan(value, condition.parameters.value);
      break;
    case "Between":
      result = between(value, condition.parameters.min, condition.parameters.max);
      break;
    case "NotBetween":
      result = !between(value, condition.parameters.min, condition.parameters.max);
      break;
    case "In":
      result = isIn(value, condition.parameters.values.split(',').map((s) => s.trim()));
      break;
    case "NotIn":
      result = !isIn(value, condition.parameters.values.split(',').map((s) => s.trim()));
      break;
    case "Contains":
      result = contains(value, condition.parameters.substring);
      break;
    case "DoesNotContain":
      result = !contains(value, condition.parameters.substring);
      break;
    case "ContainsAny":
      result = condition.parameters.substrings.split(',').map((s) => s.trim()).some((substring) => contains(value, substring));
      break;
    case "ContainsNone":
      result = condition.parameters.substrings.split(',').map((s) => s.trim()).every((substring) => !contains(value, substring));
      break;
    case "StartsWith":
      result = startsWith(value, condition.parameters.prefix);
      break;
    case "DoesNotStartWith":
      result = !startsWith(value, condition.parameters.prefix);
      break;
    case "EndsWith":
      result = endsWith(value, condition.parameters.suffix);
      break;
    case "DoesNotEndWith":
      result = !endsWith(value, condition.parameters.suffix);
      break;
    case "Like":
      result = like(value, condition.parameters.regex);
      break;
    case "NotLike":
      result = !like(value, condition.parameters.regex);
      break;
    case "OnDayOfWeek":
      result = onDayOfWeek(value, condition.parameters.day);
      break;
    case "OnDayOfMonth":
      result = onDayOfMonth(value, condition.parameters.day);
      break;
    case "OnDayOfYear":
      result = onDayOfYear(value, condition.parameters.day);
      break;
    case "OnDayMonthOfYear":
      result = onDayMonthOfYear(value, condition.parameters.month, condition.parameters.day);
      break;
    case "InWeekOfMonth":
      result = inWeekOfMonth(value, condition.parameters.week);
      break;
    case "InWeekOfYear":
      result = inWeekOfYear(value, condition.parameters.week);
      break;
    case "InMonthOfYear":
      result = inMonthOfYear(value, condition.parameters.month);
      break;
    case "InYear":
      result = inYear(value, condition.parameters.year);
      break;
    default:
      throw Error(`Condition.operator: Found ${condition.operator}. Expected one of ${Object.values(ConditionOperator)}.`);
  }
  return condition.negate ? !result : result;
}

export function validateFilter(filter:ConditionGroup|Condition|null, context:DataContextType) : string | null {
  if (filter === null) {
    return null;
  }
  switch(filter.type) {
    case FilterType.ConditionGroup:
      return validateConditionGroup(filter as ConditionGroup, context);
    case FilterType.Condition:
      return validateCondition(filter as Condition, context);
    default:
      return `Filter.type: Found ${filter.type}. Expected one of ${Object.values(FilterType)}.`;
  }
}

function validateConditionGroup(group:ConditionGroup, context:DataContextType) : string {
  switch (group.operator) {
    case ConditionGroupOperator.AND:
      return group.conditions.map((condition) => validateFilter(condition, context)).filter((error) => error && error !== "").join("\n");
    case ConditionGroupOperator.OR:
      // child can be a condition or another group
      return group.conditions.map((condition) => validateFilter(condition, context)).filter((error) => error && error !== "").join("\n");
    default:
      return `ConditionGroup.operator: Found '${group.operator}'. Expected one of ${Object.values(ConditionGroupOperator)}.`;
  }
}

function validateCondition(condition:Condition, context:DataContextType) : string | null {
  // validate negate
  if (condition.negate !== true && condition.negate !== false) {
    return `Condition.negate: Found ${condition.negate}. Expected true or false.`;
  }
  // validate operator
  if (!Object.values(ConditionOperator).includes(condition.operator)) {
    return `Condition.operator: Found ${condition.operator}. Expected one of ${Object.values(ConditionOperator)}.`;
  }
  // validate operandType
  if (operandTypes[condition.operator] !== FieldType.Any && operandTypes[condition.operator] !== condition.operandType) {
    return `Condition.operandType: Found ${condition.operandType}. Expected ${operandTypes[condition.operator]}`;
  }
  // validate parameters
  if (!setEquals(Object.keys(condition.parameters), Object.keys(parametersMap[condition.operator]))) {
    return `Condition.parameters: Found ${JSON.stringify(condition.parameters)}. Expected keys ${Object.keys(parametersMap[condition.operator])}.`;
  }
  // validate parameter values are defined
  // TODO allow for optional operands (like case sensitivity)
  for (const [key, value] of Object.entries(condition.parameters)) {
    // validate that parameter values are defined
    if (value === null || value === undefined) {
      return `Condition.parameters.${key}: Found ${value}. Expected value.`;
    }
    // validate parameter value types
    switch (parametersMap[condition.operator][key].type) {
      case FieldType.Number:
        if (isNaN(Number(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
        }
        condition.parameters[key] = Number(value);
        break;
      case FieldType.Date:
        if (isNaN(Date.parse(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
        }
        condition.parameters[key] = new Date(Date.parse(value));
        break;
      case FieldType.String:
        condition.parameters[key] = typeof condition.parameters[key] === "string"
          ? condition.parameters[key]
          : JSON.stringify(condition.parameters[key]);
        break;
      default: // including FieldType.Any
        // match type of operand
        switch (condition.operandType) {
          // TODO remove copypasta
          case FieldType.Number:
            if (isNaN(Number(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
            }
            condition.parameters[key] = Number(value);
            break;
          case FieldType.Date:
            if (isNaN(Date.parse(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
            }
            condition.parameters[key] = new Date(Date.parse(value));
            break;
          case FieldType.String:
            condition.parameters[key] = typeof condition.parameters[key] === "string"
              ? condition.parameters[key]
              : JSON.stringify(condition.parameters[key]);
            break;
          default:
            break;
        }
        break;
    }
  }
  // validate fieldname, field type
  if (context === null) {
    return `Cannot validate Condition against null context.`;
  }
  const column = context.columns.find((column) => column.name === condition.fieldname);
  if (!column) {
    return `Condition.fieldname: Found '${condition.fieldname}'. Expected one of ${context.columns.map((column) => column.name).join(", ")}.`;
  }
  if (operandTypes[condition.operator] !== FieldType.Any
    && operandTypes[condition.operator] !== FieldType.String
    && operandTypes[condition.operator] !== column.type) {
      return `Condition.fieldname: Found column of type ${column.type}. Expected ${operandTypes[condition.operator]}.`;
  }
  return null;
}