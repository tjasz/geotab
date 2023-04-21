import { setEquals } from './algorithm'
import { DataContextType } from './dataContext';
import { FieldTypeDescription } from './fieldtype'
import { toType } from './fieldtype'

type ParameterSpec = {[index:string] : {type: FieldTypeDescription}}
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
  operandType: FieldTypeDescription;
  fieldname: string;
  parameters: ParameterDef;
  negate: boolean;

  constructor(operator:ConditionOperator, operandType:FieldTypeDescription, fieldname:string, parameters:ParameterDef, negate:boolean=false) {
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

export const operandTypes : {[key in ConditionOperator]: FieldTypeDescription} = {
  [ConditionOperator.IsEmpty]: FieldTypeDescription.String,
  [ConditionOperator.IsNotEmpty]: FieldTypeDescription.String,
  [ConditionOperator.EqualTo]: FieldTypeDescription.Any,
  [ConditionOperator.NotEqualTo]: FieldTypeDescription.Any,
  [ConditionOperator.GreaterThan]: FieldTypeDescription.Any,
  [ConditionOperator.GreaterThanOrEqualTo]: FieldTypeDescription.Any,
  [ConditionOperator.LessThan]: FieldTypeDescription.Any,
  [ConditionOperator.LessThanOrEqualTo]: FieldTypeDescription.Any,
  [ConditionOperator.Between]: FieldTypeDescription.Any,
  [ConditionOperator.NotBetween]: FieldTypeDescription.Any,
  [ConditionOperator.In]: FieldTypeDescription.Any,
  [ConditionOperator.NotIn]: FieldTypeDescription.Any,
  [ConditionOperator.Contains]: FieldTypeDescription.String,
  [ConditionOperator.DoesNotContain]: FieldTypeDescription.String,
  [ConditionOperator.ContainsAny]: FieldTypeDescription.String,
  [ConditionOperator.ContainsNone]: FieldTypeDescription.String,
  [ConditionOperator.StartsWith]: FieldTypeDescription.String,
  [ConditionOperator.DoesNotStartWith]: FieldTypeDescription.String,
  [ConditionOperator.EndsWith]: FieldTypeDescription.String,
  [ConditionOperator.DoesNotEndWith]: FieldTypeDescription.String,
  [ConditionOperator.Like]: FieldTypeDescription.String,
  [ConditionOperator.NotLike]: FieldTypeDescription.String,
  [ConditionOperator.OnDayOfWeek]: FieldTypeDescription.Date,
  [ConditionOperator.OnDayOfMonth]: FieldTypeDescription.Date,
  [ConditionOperator.OnDayOfYear]: FieldTypeDescription.Date,
  [ConditionOperator.OnDayMonthOfYear]: FieldTypeDescription.Date,
  [ConditionOperator.InWeekOfMonth]: FieldTypeDescription.Date,
  [ConditionOperator.InWeekOfYear]: FieldTypeDescription.Date,
  [ConditionOperator.InMonthOfYear]: FieldTypeDescription.Date,
  [ConditionOperator.InYear]: FieldTypeDescription.Date,
};

export const parametersMap : {[key in ConditionOperator]: ParameterSpec} = {
  [ConditionOperator.IsEmpty]: {},
  [ConditionOperator.IsNotEmpty]: {},
  [ConditionOperator.EqualTo]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.NotEqualTo]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.GreaterThan]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.GreaterThanOrEqualTo]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.LessThan]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.LessThanOrEqualTo]: {value: {type: FieldTypeDescription.Any}},
  [ConditionOperator.Between]: {min: {type: FieldTypeDescription.Any}, max: {type: FieldTypeDescription.Any}},
  [ConditionOperator.NotBetween]: {min: {type: FieldTypeDescription.Any}, max: {type: FieldTypeDescription.Any}},
  [ConditionOperator.In]: {values: {type: FieldTypeDescription.Any}}, // TODO set(auto)
  [ConditionOperator.NotIn]: {values: {type: FieldTypeDescription.Any}}, // TODO set(auto)
  [ConditionOperator.Contains]: {substring: {type: FieldTypeDescription.String}},
  [ConditionOperator.DoesNotContain]: {substring: {type: FieldTypeDescription.String}},
  [ConditionOperator.ContainsAny]: {substrings: {type: FieldTypeDescription.String}}, // TODO set(string)
  [ConditionOperator.ContainsNone]: {substrings: {type: FieldTypeDescription.String}}, // TODO set(string)
  [ConditionOperator.StartsWith]: {prefix: {type: FieldTypeDescription.String}},
  [ConditionOperator.DoesNotStartWith]: {prefix: {type: FieldTypeDescription.String}},
  [ConditionOperator.EndsWith]: {suffix: {type: FieldTypeDescription.String}},
  [ConditionOperator.DoesNotEndWith]: {suffix: {type: FieldTypeDescription.String}},
  [ConditionOperator.Like]: {regex: {type: FieldTypeDescription.String}},
  [ConditionOperator.NotLike]: {regex: {type: FieldTypeDescription.String}},
  [ConditionOperator.OnDayOfWeek]: {day: {type: FieldTypeDescription.Number}},
  [ConditionOperator.OnDayOfMonth]: {day: {type: FieldTypeDescription.Number}},
  [ConditionOperator.OnDayOfYear]: {day: {type: FieldTypeDescription.Number}},
  [ConditionOperator.OnDayMonthOfYear]: {day: {type: FieldTypeDescription.Number}, month: {type: FieldTypeDescription.Number}},
  [ConditionOperator.InWeekOfMonth]: {week: {type: FieldTypeDescription.Number}},
  [ConditionOperator.InWeekOfYear]: {week: {type: FieldTypeDescription.Number}},
  [ConditionOperator.InMonthOfYear]: {month: {type: FieldTypeDescription.Number}},
  [ConditionOperator.InYear]: {year: {type: FieldTypeDescription.Number}},
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
  if (a?.type !== b?.type) return false;
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

function getParameter(condition:Condition, pname:string) {
  const type = parametersMap[condition.operator][pname].type === FieldTypeDescription.Any
    ? condition.operandType
    : parametersMap[condition.operator][pname].type;
  return toType(condition.parameters[pname], type);
}

function evaluateCondition(row, condition:Condition) : boolean {
  let result = true;
  let value = toType(row.properties[condition.fieldname], condition.operandType);
  switch (condition.operator) {
    case "IsEmpty":
      result = isEmpty(value);
      break;
    case "IsNotEmpty":
      result = !isEmpty(value);
      break;
    case "EqualTo":
      result = equalTo(value, getParameter(condition, "value"));
      break;
    case "NotEqualTo":
      result = !equalTo(value, getParameter(condition, "value"));
      break;
    case "GreaterThan":
      result = greaterThan(value, getParameter(condition, "value"));
      break;
    case "GreaterThanOrEqualTo":
      result = !lessThan(value, getParameter(condition, "value"));
      break;
    case "LessThan":
      result = lessThan(value, getParameter(condition, "value"));
      break;
    case "LessThanOrEqualTo":
      result = !greaterThan(value, getParameter(condition, "value"));
      break;
    case "Between":
      result = between(value, getParameter(condition, "min"), getParameter(condition, "max"));
      break;
    case "NotBetween":
      result = !between(value, getParameter(condition, "min"), getParameter(condition, "max"));
      break;
    case "In":
      result = isIn(value, condition.parameters.values.split(',').map((s) => s.trim()));
      break;
    case "NotIn":
      result = !isIn(value, condition.parameters.values.split(',').map((s) => s.trim()));
      break;
    case "Contains":
      result = contains(value, getParameter(condition, "substring"));
      break;
    case "DoesNotContain":
      result = !contains(value, getParameter(condition, "substring"));
      break;
    case "ContainsAny":
      result = condition.parameters.substrings.split(',').map((s) => s.trim()).some((substring) => contains(value, substring));
      break;
    case "ContainsNone":
      result = condition.parameters.substrings.split(',').map((s) => s.trim()).every((substring) => !contains(value, substring));
      break;
    case "StartsWith":
      result = startsWith(value, getParameter(condition, "prefix"));
      break;
    case "DoesNotStartWith":
      result = !startsWith(value, getParameter(condition, "prefix"));
      break;
    case "EndsWith":
      result = endsWith(value, getParameter(condition, "suffix"));
      break;
    case "DoesNotEndWith":
      result = !endsWith(value, getParameter(condition, "suffix"));
      break;
    case "Like":
      result = like(value, getParameter(condition, "regex"));
      break;
    case "NotLike":
      result = !like(value, getParameter(condition, "regex"));
      break;
    case "OnDayOfWeek":
      result = onDayOfWeek(value, getParameter(condition, "day"));
      break;
    case "OnDayOfMonth":
      result = onDayOfMonth(value, getParameter(condition, "day"));
      break;
    case "OnDayOfYear":
      result = onDayOfYear(value, getParameter(condition, "day"));
      break;
    case "OnDayMonthOfYear":
      result = onDayMonthOfYear(value, getParameter(condition, "month"), getParameter(condition, "day"));
      break;
    case "InWeekOfMonth":
      result = inWeekOfMonth(value, getParameter(condition, "week"));
      break;
    case "InWeekOfYear":
      result = inWeekOfYear(value, getParameter(condition, "week"));
      break;
    case "InMonthOfYear":
      result = inMonthOfYear(value, getParameter(condition, "month"));
      break;
    case "InYear":
      result = inYear(value, getParameter(condition, "year"));
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
  if (operandTypes[condition.operator] !== FieldTypeDescription.Any && operandTypes[condition.operator] !== condition.operandType) {
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
      case FieldTypeDescription.Number:
        if (isNaN(Number(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
        }
        condition.parameters[key] = Number(value);
        break;
      case FieldTypeDescription.Date:
        if (isNaN(Date.parse(value)) && isNaN(Number(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
        }
        condition.parameters[key] = new Date(Date.parse(value));
        break;
      case FieldTypeDescription.String:
        condition.parameters[key] = typeof condition.parameters[key] === "string"
          ? condition.parameters[key]
          : JSON.stringify(condition.parameters[key]);
        break;
      default: // including FieldTypeDescription.Any
        // match type of operand
        switch (condition.operandType) {
          // TODO remove copypasta
          case FieldTypeDescription.Number:
            if (isNaN(Number(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
            }
            condition.parameters[key] = Number(value);
            break;
          case FieldTypeDescription.Date:
            if (isNaN(Date.parse(value)) && isNaN(Number(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
            }
            condition.parameters[key] = new Date(Date.parse(value));
            break;
          case FieldTypeDescription.String:
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
  if (operandTypes[condition.operator] !== FieldTypeDescription.Any
    && operandTypes[condition.operator] !== FieldTypeDescription.String
    && operandTypes[condition.operator] !== column.type) {
      return `Condition.fieldname: Found column of type ${column.type}. Expected ${operandTypes[condition.operator]}.`;
  }
  return null;
}