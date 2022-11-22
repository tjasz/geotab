import { setEquals } from './algorithm.js'

export const conditionGroupOperators = ["and", "or"];

export function ConditionGroup(operator, conditions) {
  this.type = "ConditionGroup";
  this.operator = operator.toLowerCase();
  this.conditions = conditions;
  if (!conditionGroupOperators.includes(this.operator)) {
    throw Error(`ConditionGroup.operator: Found ${this.operator}. Expected one of ${conditionGroupOperators}.`);
  }
}

// TODO location-based conditions (ex: WithinRange)
// TODO multi-field formula conditions (ex: prominence > 0.1 * elevation)
export const conditionOperators = [
  "IsEmpty", "IsNotEmpty",
  "EqualTo", "NotEqualTo",
  "GreaterThan", "GreaterThanOrEqualTo", "LessThan", "LessThanOrEqualTo",
  "Between", "NotBetween",
  "In", "NotIn",
  "Contains", "DoesNotContain", "ContainsAny", "ContainsNone",
  "StartsWith", "DoesNotStartWith", "EndsWith", "DoesNotEndWith",
  "Like", "NotLike",
  "OnDayOfWeek", "OnDayOfMonth", "OnDayOfYear", "OnDayMonthOfYear",
  "InWeekOfMonth", "InWeekOfYear", "InMonthOfYear",
];

export const parametersMap = {
  IsEmpty: [],
  IsNotEmpty: [],
  EqualTo: ["value"],
  NotEqualTo: ["value"],
  GreaterThan: ["value"],
  GreaterThanOrEqualTo: ["value"],
  LessThan: ["value"],
  LessThanOrEqualTo: ["value"],
  Between: ["min", "max"], // min < max not actually enforced
  NotBetween: ["min", "max"],
  In: ["values"],
  NotIn: ["values"],
  Contains: ["substring"],
  DoesNotContain: ["substring"],
  ContainsAny: ["substrings"],
  ContainsNone: ["substrings"],
  StartsWith: ["prefix"],
  DoesNotStartWith: ["prefix"],
  EndsWith: ["suffix"],
  DoesNotEndWith: ["suffix"],
  Like: ["regex"],
  NotLike: ["regex"],
  OnDayOfWeek: ["day"],
  OnDayOfMonth: ["day"],
  OnDayOfYear: ["day"],
  OnDayMonthOfYear: ["day", "month"],
  InWeekOfMonth: ["week"],
  InWeekOfYear: ["week"],
  InMonthOfYear: ["month"],
};

export function Condition(operator, fieldname, parameters, negate=false) {
  this.type = "Condition";
  this.operator = operator;
  if (!conditionOperators.includes(this.operator)) {
    throw Error(`Condition.operator: Found ${this.operator}. Expected one of ${conditionOperators}.`);
  }
  // TODO should have this.dataType? support string, numeric, datetime for basic operators
  this.fieldname = fieldname;
  // TODO verify fieldname is in data table and of correct type
  this.parameters = parameters;
  if (!setEquals(Object.keys(this.parameters), parametersMap[this.operator])) {
    throw Error(`Condition.parameters: Found ${JSON.stringify(this.parameters)}. Expected keys ${parametersMap[this.operator]}.`);
  }
  // TODO ensure parameters are of correct dataType?
  this.negate = negate;
  if (this.negate !== true && this.negate !== false) {
    throw Error(`Condition.negate: Found ${this.negate}. Expected true or false.`);
  }
}

export const defaultFilter = new ConditionGroup("and", []);

export function evaluateFilter(row, filter) {
  if (filter === null) {
    return true;
  }
  switch(filter.type) {
    case "ConditionGroup":
      return evaluateConditionGroup(row, filter);
    case "Condition":
      return evaluateCondition(row, filter);
    default:
      throw Error(`Filter.type: Found ${filter.type}. Expected 'ConditionGroup' or 'Condition'.`);
  }
}

function evaluateConditionGroup(row, group) {
  switch (group.operator) {
    case "and":
      return group.conditions.every((condition) => evaluateCondition(row, condition));
    case "or":
      // child can be a condition or another group
      return group.conditions.some((condition) => evaluateFilter(row, condition));
    default:
      throw Error(`ConditionGroup.operator: Found '${group.operator}'. Expected 'and' or 'or'.`);
  }
}

function isEmpty(row, fieldname) {
  return row.properties[fieldname] === null || row.properties[fieldname] === "";
}

function equalTo(row, fieldname, value) {
  // TODO support numeric and dates; this just does string compare; same for below
  return row.properties[fieldname] === value;
}

function greaterThan(row, fieldname, value) {
  return row.properties[fieldname] > value;
}

function lessThan(row, fieldname, value) {
  return row.properties[fieldname] < value;
}

function between(row, fieldname, a, b) {
  return row.properties[fieldname] >= a && row.properties[fieldname] <= b ||
         row.properties[fieldname] <= a && row.properties[fieldname] >= b;
}

function contains(row, fieldname, substring) {
  // TODO make case sensitivity a parameter for string operators?
  return row.properties[fieldname].toUpperCase().includes(substring.toUpperCase());
}

function startsWith(row, fieldname, prefix) {
  return row.properties[fieldname].toUpperCase().startsWith(prefix.toUpperCase());
}

function endsWith(row, fieldname, suffix) {
  return row.properties[fieldname].toUpperCase().endsWith(suffix.toUpperCase());
}

function like(row, fieldname, regex) {
  return new RegExp(regex).test(row.properties[fieldname]);
}

function onDayOfWeek(row, fieldname, dayOfWeek) {
  // TODO UI should show strings Monday for 1, etc.
  return Date.parse(row.parameters[fieldname]).getDay() === (dayOfWeek % 7);
}

function evaluateCondition(row, condition) {
  let result = true;
  switch (condition.operator) {
    case "IsEmpty":
      result = isEmpty(row, condition.fieldname);
      break;
    case "IsNotEmpty":
      result = !isEmpty(row, condition.fieldname);
      break;
    case "EqualTo":
      result = equalTo(row, condition.fieldname, condition.parameters.value);
      break;
    case "NotEqualTo":
      result = !equalTo(row, condition.fieldname, condition.parameters.value);
      break;
    case "GreaterThan":
      result = greaterThan(row, condition.fieldname, condition.parameters.value);
      break;
    case "GreaterThanOrEqualTo":
      result = !lessThan(row, condition.fieldname, condition.parameters.value);
      break;
    case "LessThan":
      result = lessThan(row, condition.fieldname, condition.parameters.value);
      break;
    case "LessThanOrEqualTo":
      result = !greaterThan(row, condition.fieldname, condition.parameters.value);
      break;
    case "Between":
      result = between(row, condition.fieldname, condition.parameters.min, condition.parameters.max);
      break;
    case "NotBetween":
      result = !between(row, condition.fieldname, condition.parameters.min, condition.parameters.max);
      break;
    case "In":
      // TODO
      throw Error("Unimplemented function In");
      break;
    case "NotIn":
      // TODO
      throw Error("Unimplemented function NotIn");
      break;
    case "Contains":
      result = contains(row, condition.fieldname, condition.parameters.substring);
      break;
    case "DoesNotContain":
      result = !contains(row, condition.fieldname, condition.parameters.substring);
      break;
    case "ContainsAny":
      // TODO
      throw Error("Unimplemented function ContainsAny");
      break;
    case "ContainsNone":
      // TODO
      throw Error("Unimplemented function ContainsNone");
      break;
    case "StartsWith":
      result = startsWith(row, condition.fieldname, condition.parameters.prefix);
      break;
    case "DoesNotStartWith":
      result = !startsWith(row, condition.fieldname, condition.parameters.prefix);
      break;
    case "EndsWith":
      result = endsWith(row, condition.fieldname, condition.parameters.suffix);
      break;
    case "DoesNotEndWith":
      result = !endsWith(row, condition.fieldname, condition.parameters.suffix);
      break;
    case "Like":
      result = like(row, condition.fieldname, condition.parameters.regex);
      break;
    case "NotLike":
      result = !like(row, condition.fieldname, condition.parameters.regex);
      break;
    case "OnDayOfWeek":
      result = onDayOfWeek(row, condition.fieldname, condition.parameters.day);
      break;
    case "OnDayOfMonth":
      // TODO
      throw Error("Unimplemented function OnDayOfMonth");
      break;
    case "OnDayOfYear":
      // TODO
      throw Error("Unimplemented function OnDayOfYear");
      break;
    case "OnDayMonthOfYear":
      // TODO
      throw Error("Unimplemented function OnDayMonthOfYear");
      break;
    case "InWeekOfMonth":
      // TODO
      throw Error("Unimplemented function InWeekOfMonth");
      break;
    case "InWeekOfYear":
      // TODO
      throw Error("Unimplemented function InWeekOfYear");
      break;
    case "InMonthOfYear":
      // TODO
      throw Error("Unimplemented function InMonthOfYear");
      break;
    default:
      throw Error(`Condition.operator: Found ${condition.operator}. Expected one of ${conditionOperators}.`);
  }
  return condition.negate ? !result : result;
}