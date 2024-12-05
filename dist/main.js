var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import core from "@actions/core";
import github from "@actions/github";
const SUCCESS_MESSAGE = ":rocket: Your PR has all required labels and Jira ticket :rocket:";
function getInputArray(name) {
  const rawInput = core.getInput(name);
  return rawInput !== "" ? rawInput.split(",") : [];
}
class PrChecker {
  constructor(prNumber, labels, requiredLabels, ghToken, jiraRegex) {
    this.prNumber = prNumber;
    this.labels = labels;
    this.requiredLabels = requiredLabels;
    this.jiraRegExp = new RegExp(jiraRegex);
    this.octokit = github.getOctokit(ghToken);
  }
  async run() {
    this.checkLabels();
    this.checkTitle();
  }
  async checkTitle() {
    if (!this.jiraRegExp.test(github.context.payload.pull_request.title)) {
      const errorMessage = `:eyes: Looks like your PR does not have a Jira number or NOJIRA on the title :rocket:`;
      if (!await this.isLastComment(errorMessage)) {
        this.createComment(errorMessage);
      }
      core.setFailed("Please add Jira number or NOJIRA on the PR Title");
    }
  }
  async checkLabels() {
    if (!this.requiredLabels.some((requiredLabel) => this.labels.find((l) => l.name === requiredLabel))) {
      const errorMessage = `:eyes: Looks like your PR does not have any required label assigned to it. Please :pray: assign one of the following: ${this.requiredLabels.join(", ")} :rocket:`;
      if (!await this.isLastComment(errorMessage)) {
        this.createComment(errorMessage);
      }
      core.setFailed(`Please select one of the required labels for this PR: ${this.requiredLabels}`);
    } else if (!await this.isLastComment(SUCCESS_MESSAGE)) {
      this.createComment(SUCCESS_MESSAGE);
    }
  }
  createComment(body) {
    this.octokit.rest.issues.createComment(__spreadProps(__spreadValues({}, github.context.repo), {
      issue_number: this.prNumber,
      body
    }));
  }
  async isLastComment(message) {
    const comments = await this.octokit.rest.issues.listComments(__spreadProps(__spreadValues({}, github.context.repo), {
      issue_number: this.prNumber
    }));
    if (comments.data.length === 0) {
      return false;
    }
    return comments.data[comments.data.length - 1].body === message;
  }
}
new PrChecker(github.context.payload.pull_request.number, github.context.payload.pull_request.labels, getInputArray("required_labels"), core.getInput("gh_token"), core.getInput("jira_title_regex")).run();
