//Fork and modification the pr-checker-github-action by santo
//Modifier gustavo1020
import core from "@actions/core";
import github from "@actions/github";

type GithubLabel = {
  name: string;
  color: string;
};

const LABELS_SUCCESS_MESSAGE =
  ":rocket: El PR tiene los labels requeridos :rocket:";
const SUCCESS_MESSAGE =
  ":rocket: El PR tiene un titulo correcto :rocket:";

function getInputArray(name: string): string[] {
  const rawInput = core.getInput(name);
  return rawInput !== "" ? rawInput.split(",") : [];
}

class PrChecker {
  private prNumber: number;
  private labels: GithubLabel[];
  private requiredLabels: string[];
  private jiraRegExp: RegExp;
  private octokit;
  private projectMMonitoring;

  constructor(
    prNumber: number,
    labels: GithubLabel[],
    requiredLabels: string[],
    ghToken: string,
    jiraRegex: string,
    projectMonitoring: string
  ) {
    this.prNumber = prNumber;
    this.labels = labels;
    this.requiredLabels = requiredLabels;

    this.jiraRegExp = new RegExp(jiraRegex);

    this.octokit = github.getOctokit(ghToken);
    this.projectMMonitoring = projectMonitoring;
  }

  public async run() {
    this.checkLabels();
    this.checkTitle();
  }

  private async checkTitle() {
    if (!this.jiraRegExp.test(github.context!.payload!.pull_request!.title)) {
      const errorMessage = `:eyes: Parece que tu PR no tiene un ticket de ${this.projectMMonitoring} o NO${this.projectMMonitoring.toUpperCase()} en el titulo :rocket:`;

      if (!(await this.isLastComment(errorMessage))) {
        this.createComment(errorMessage);
      }

      core.setFailed(`Agregue el numero de ${this.projectMMonitoring} o NO${this.projectMMonitoring.toUpperCase()} en el título del PR`);
    } else if (!(await this.isLastComment(SUCCESS_MESSAGE))) {
      this.createComment(SUCCESS_MESSAGE);
    }
  }

  private async checkLabels() {
    if (
      !this.requiredLabels.some((requiredLabel) =>
        this.labels.find((l: GithubLabel) => l.name === requiredLabel)
      )
    ) {
      const errorMessage = `:eyes: Parece que el PR no tiene ningun label requerido asignado. Por favor, :pray: asigna una de los siguientes: ${this.requiredLabels.join(
        ", "
      )} :rocket:`;

      if (!(await this.isLastComment(errorMessage))) {
        this.createComment(errorMessage);
      }

      core.setFailed(
        `Por favor seleccione uno de los labels requeridos para este PR: ${this.requiredLabels}`
      );
    } else if (!(await this.isLastComment(LABELS_SUCCESS_MESSAGE))) {
      this.createComment(LABELS_SUCCESS_MESSAGE);
    }
  }

  private createComment(body: string) {
    this.octokit.rest.issues.createComment({
      ...github.context!.repo,
      issue_number: this.prNumber,
      body,
    });
  }

  private async isLastComment(message: string) {
    const comments = await this.octokit.rest.issues.listComments({
      ...github.context!.repo,
      issue_number: this.prNumber,
    });

    if (comments.data.length === 0) {
      return false;
    }

    return comments.data[comments.data.length - 1].body === message;
  }
}

new PrChecker(
  github.context!.payload!.pull_request!.number,
  github.context!.payload!.pull_request!.labels,
  getInputArray("required_labels"),
  core.getInput("gh_token"),
  core.getInput("title_regex"),
  core.getInput("project_monitoring"),
).run();
