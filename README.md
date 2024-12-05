# PR Checker Github Actions

Just an example for a PR

## Description

This action will verify the following rules:

- The PR includes at least one of the labels specified in the action configuration.
- The PR should include the following patter on the title `[NOJIRA] foo` or `[FG-123] foo`.

You will not be able to merge the Pull Request if the action is not passing both checks.

## Inputs

- `required_labels` **required** The labels that are required to be present on the Pull Request.
- `title_regex` **required** The regex that the title should match.
- `gh_token`: **required** The Github token to use to authenticate and create the result comment.

## Example usage

```
- name: Label Checker
  uses: gustavo1020/Validate-PR@v1.0.0-stable-1
  id: pr-checker-github-action
  with:
    gh_token: ${{ secrets.GITHUB_TOKEN }}
    title_regex: \[(([A-Z][A-Z0-9]+-[0-9]+)|NOJIRA)\]
    required_labels: "feature,bug,documentation,breaking,chore"
```
