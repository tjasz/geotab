import { setEquals } from './algorithm.js'

export const filterTypes = ["Condition", "ConditionGroup"];

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
  "InWeekOfMonth", "InWeekOfYear", "InMonthOfYear", "InYear"
];

export const operandTypes = {
  IsEmpty: "auto",
  IsNotEmpty: "auto",
  EqualTo: "auto",
  NotEqualTo: "auto",
  GreaterThan: "auto",
  GreaterThanOrEqualTo: "auto",
  LessThan: "auto",
  LessThanOrEqualTo: "auto",
  Between: "auto",
  NotBetween: "auto",
  In: "auto",
  NotIn: "auto",
  Contains: "string",
  DoesNotContain: "string",
  ContainsAny: "string",
  ContainsNone: "string",
  StartsWith: "string",
  DoesNotStartWith: "string",
  EndsWith: "string",
  DoesNotEndWith: "string",
  Like: "string",
  NotLike: "string",
  OnDayOfWeek: "date",
  OnDayOfMonth: "date",
  OnDayOfYear: "date",
  OnDayMonthOfYear: "date",
  InWeekOfMonth: "date",
  InWeekOfYear: "date",
  InMonthOfYear: "date",
  InYear: "date",
};

export const parametersMap = {
  IsEmpty: [],
  IsNotEmpty: [],
  EqualTo: {value: {type: "auto"}},
  NotEqualTo: {value: {type: "auto"}},
  GreaterThan: {value: {type: "auto"}},
  GreaterThanOrEqualTo: {value: {type: "auto"}},
  LessThan: {value: {type: "auto"}},
  LessThanOrEqualTo: {value: {type: "auto"}},
  Between: {min: {type: "auto"}, max: {type: "auto"}},
  NotBetween: {min: {type: "auto"}, max: {type: "auto"}},
  In: {values: {type: "auto"}}, // TODO set(auto)
  NotIn: {values: {type: "auto"}}, // TODO set(auto)
  Contains: {substring: {type: "string"}},
  DoesNotContain: {substring: {type: "string"}},
  ContainsAny: {substrings: {type: "string"}}, // TODO set(string)
  ContainsNone: {substrings: {type: "string"}}, // TODO set(string)
  StartsWith: {prefix: {type: "string"}},
  DoesNotStartWith: {prefix: {type: "string"}},
  EndsWith: {suffix: {type: "string"}},
  DoesNotEndWith: {suffix: {type: "string"}},
  Like: {regex: {type: "string"}},
  NotLike: {regex: {type: "string"}},
  OnDayOfWeek: {day: {type: "number"}},
  OnDayOfMonth: {day: {type: "number"}},
  OnDayOfYear: {day: {type: "number"}},
  OnDayMonthOfYear: {day: {type: "number"}, month: {type: "number"}},
  InWeekOfMonth: {week: {type: "number"}},
  InWeekOfYear: {week: {type: "number"}},
  InMonthOfYear: {month: {type: "number"}},
  InYear: {year: {type: "number"}},
};

export function Condition(operator, operandType, fieldname, parameters, negate=false) {
  this.type = "Condition";
  this.operator = operator;
  this.operandType = operandType
  if (!conditionOperators.includes(this.operator)) {
    throw Error(`Condition.operator: Found ${this.operator}. Expected one of ${conditionOperators}.`);
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

export function filterEquals(a, b) {
  if (a.type !== b.type) return false;
  if (a.operator !== b.operator) return false;
  if (a.type === "ConditionGroup") {
    return a.conditions.every((acondition) => b.conditions.some((bcondition) => filterEquals(acondition, bcondition))) &&
           b.conditions.every((bcondition) => a.conditions.some((acondition) => filterEquals(acondition, bcondition)));
  }
  else if (a.type === "Condition") {
    if (a.fieldname !== b.fieldname) return false;
    if (a.negate !== b.negate) return false;
    return Object.keys(a.parameters).every((key) => a.parameters[key] === b.parameters[key]) &&
           Object.keys(b.parameters).every((key) => a.parameters[key] === b.parameters[key]);
  }
  throw Error(`Filter.type: Found ${a.type}. Expected 'ConditionGroup' or 'Condition'.`);
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
      return group.conditions.every((condition) => evaluateFilter(row, condition));
    case "or":
      // child can be a condition or another group
      return group.conditions.some((condition) => evaluateFilter(row, condition));
    default:
      throw Error(`ConditionGroup.operator: Found '${group.operator}'. Expected 'and' or 'or'.`);
  }
}

function isEmpty(rowValue) {
  return rowValue === null || rowValue === undefined || rowValue === "";
}

function equalTo(rowValue, value) {
  return rowValue === value;
}

function greaterThan(rowValue, value) {
  return rowValue > value;
}

function lessThan(rowValue, value) {
  return rowValue < value;
}

function between(rowValue, a, b) {
  return rowValue >= a && rowValue <= b ||
         rowValue <= a && rowValue >= b;
}

function isIn(rowValue, values) {
  return values.includes(rowValue);
}

function contains(rowValue, substring) {
  // TODO make case sensitivity a parameter for string operators?
  return rowValue && rowValue.toUpperCase().includes(substring.toUpperCase());
}

function startsWith(rowValue, prefix) {
  return rowValue && rowValue.toUpperCase().startsWith(prefix.toUpperCase());
}

function endsWith(rowValue, suffix) {
  return rowValue && rowValue.toUpperCase().endsWith(suffix.toUpperCase());
}

function like(rowValue, regex) {
  return new RegExp(regex).test(rowValue);
}

function onDayOfWeek(rowValue, dayOfWeek) {
  // TODO UI should show strings Monday for 1, etc.
  return new Date(Date.parse(rowValue)).getDay() === (dayOfWeek % 7);
}

function evaluateCondition(row, condition) {
  let result = true;
  let value = row.properties[condition.fieldname];
  switch (condition.operandType) {
    case "number":
      value = Number(value);
      break;
    case "date":
      value = new Date(Date.parse(value));
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
    case "InYear":
      // TODO
      throw Error("Unimplemented function InYear");
      break;
    default:
      throw Error(`Condition.operator: Found ${condition.operator}. Expected one of ${conditionOperators}.`);
  }
  return condition.negate ? !result : result;
}

export function validateFilter(filter, context) {
  if (filter === null) {
    return null;
  }
  switch(filter.type) {
    case "ConditionGroup":
      return validateConditionGroup(filter, context);
    case "Condition":
      return validateCondition(filter, context);
    default:
      return `Filter.type: Found ${filter.type}. Expected 'ConditionGroup' or 'Condition'.`;
  }
}

function validateConditionGroup(group, context) {
  switch (group.operator) {
    case "and":
      return group.conditions.map((condition) => validateFilter(condition, context)).filter((error) => error && error !== "").join("\n");
    case "or":
      // child can be a condition or another group
      return group.conditions.map((condition) => validateFilter(condition, context)).filter((error) => error && error !== "").join("\n");
    default:
      return `ConditionGroup.operator: Found '${group.operator}'. Expected 'and' or 'or'.`;
  }
}

function validateCondition(condition, context) {
  // validate negate
  if (condition.negate !== true && condition.negate !== false) {
    return `Condition.negate: Found ${condition.negate}. Expected true or false.`;
  }
  // validate fieldname
  const column = context.columns.find((column) => column.name === condition.fieldname);
  if (!column) {
    return `Condition.fieldname: Found '${condition.fieldname}'. Expected one of ${context.columns.map((column) => column.name).join(", ")}.`;
  }
  // validate parameters
  if (!setEquals(Object.keys(condition.parameters), Object.keys(parametersMap[condition.operator]))) {
    return `Condition.parameters: Found ${JSON.stringify(condition.parameters)}. Expected keys ${Object.keys(parametersMap[condition.operator])}.`;
  }
  // validate parameter values are defined
  // TODO allow for optional operands (like case sensitive)
  for (const [key, value] of Object.entries(condition.parameters)) {
    // validate that parameter values are defined
    if (value === null || value === undefined) {
      return `Condition.parameters.${key}: Found ${value}. Expected value.`;
    }
    // validate parameter value types
    switch (parametersMap[condition.operator][key].type) {
      case "number":
        if (isNaN(Number(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
        }
        condition.parameters[key] = Number(value);
        break;
      case "date":
        if (isNaN(Date.parse(value))) {
          return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
        }
        condition.parameters[key] = new Date(Date.parse(value));
        break;
      default: // including auto
        // match type of operand
        switch (condition.operandType) {
          // TODO remove copypasta
          case "number":
            if (isNaN(Number(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected number.`;
            }
            condition.parameters[key] = Number(value);
            break;
          case "date":
            if (isNaN(Date.parse(value))) {
              return `Condition.parameters.${key}: Found '${value}'. Expected date.`;
            }
            condition.parameters[key] = new Date(Date.parse(value));
            break;
          default:
            break;
        }
        break;
    }
  }
  // validate operator
  if (!conditionOperators.includes(condition.operator)) {
    return `Condition.operator: Found ${condition.operator}. Expected one of ${conditionOperators}.`;
  }
  return null;
}