import { IIssue } from '../http/api.model';
import { atlassianMarkupToHtml } from '../shared/utilities';

const styles = `
  html {
    font: 62.5%/1.4;
  }

  body {
    font-size: 1.4em;
    line-height: 1.4;
  }

  ul, ol {
    line-height: 1.4em;
  }

  header {
    display: flex;
    flex-direction: row;
    max-height: 20%;
  }

  header > div {
    display: flex;
    flex-direction: column;
    width: 50%;
  }
  
  header table,
  header caption,
  header tbody,
  header tfoot,
  header thead,
  header tr,
  header th,
  header td {
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    font-size: 90%;
    vertical-align: middle;
    background: transparent;
  }

  header td > img {
    min-height: 1em;
    min-width: 1em;
  }

  .main h1, .main h2, .main h3, .main h4, .main h5, .main h6 {
    font-size: 90%;
  }
`;

export default (ticket: IIssue) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ticket.key}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <h3>${ticket.fields.summary}</h3>
  <header>
    <div>
      <table>
        <tbody>
          <tr>
            <td><strong>Type:</strong></td>
            <td><img src="${ticket.fields.issuetype.iconUrl}" /></td>
            <td>${ticket.fields.issuetype.name}</td>
          </tr>
          <tr>
            <td><strong>Priority:</strong></td>
            <td><img src="${ticket.fields.priority.iconUrl}" /></td>
            <td>${ticket.fields.priority.name}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <table>
        <tbody>
          <tr>
            <td><strong>Labels:</strong></td>
            <td>${ticket.fields.labels.map((l:string) => `<span>${l}</span>`).join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>${ticket.fields.status.name}</td>
          </td>
        </tbody>
      </table>
    </div>
  </header>
  <div class="main">
    ${ticket.renderedFields && ticket.renderedFields.description ? ticket.renderedFields.description : ''}
  </div>
  <script type="text/javascript">
    document.body.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      var vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'jira-plugin.openIssueCommand',
        title: 'View issue',
        arguments: [e.target.getAttribute('href')]
      });
    }, true);
  </script>
</body>
</html>`;