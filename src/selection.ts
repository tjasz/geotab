// Manipulate the selection status to add or remove "hover", or to activate or deactivate

export function addHover(status?: string) {
  if (status === undefined) {
    return "hoverinactive";
  }
  return status.includes("hover") ? status : "hover" + status;
}

export function removeHover(status?: string) {
  if (status === undefined) {
    return "inactive";
  }
  return status.replace("hover", "");
}

export function toggleActive(status?: string) {
  if (status === undefined) {
    return "active";
  }
  return status.includes("inactive")
    ? status.replace("inactive", "active")
    : status.replace("active", "inactive");
}
