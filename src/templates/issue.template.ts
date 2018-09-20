import { IIssue } from '../http/api.model';

const styles = `
  html {
    font: 62.5%/1.4;
  }

  body {
    font-size: 1.4em;
    line-height: 1.4;
    padding: 0;
  }

  nav {
    background-color: #000;
    display: block;
    padding: 10px;
    margin-bottom: 2em;
  }

  nav button {
    -webkit-appearance: none;
    appearance: none;
    background-color: #17649A;
    border: none;
    border: 1px solid #888;
    color: white;
    cursor: pointer;
    font-weight: bold;
  }

  nav button:hover {
    background-color: #1B78B9;
  }

  nav button:disabled {
    background-color: #888;
  }

  main {
    padding: 10px;
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

  .main {
    align-items: flex-start;
    display: flex;
    flex-direction: row;
    justify-content: stretch;
  }

  .main h1, .main h2, .main h3, .main h4, .main h5, .main h6 {
    font-size: 90%;
  }

  .main > section {
    height: 100%;
    width: 80%;
  }

  .main > aside {
    height: 100%;
    min-width: 200px;
    width: 20%;
  }

  .main > aside img {
    border-radius: 100%;
  }
`;

const renderBackButton = (prevItem: { key: string, url: string }) =>
  prevItem
    ? `<a href="${prevItem.url}">${prevItem.key}</a>`
    : '';

export default (ticket: IIssue, history: { key: string, url: string }[]) => `
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
  <nav>
    ${renderBackButton(history[history.length - 1])}
  </nav>
  <main>
    <h3>${ticket.fields.summary}</h3>
    <header>
      <div>
        <h4>Details</h4>
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
      <section>
        ${ticket.renderedFields && ticket.renderedFields.description ? ticket.renderedFields.description : ''}
      </section>
      <aside>
        <table>
          <tbody>
            <tr>
              <td>Asignee:</td>
              <td>
                ${ticket.fields.assignee && ticket.fields.assignee.avatarUrls ? `<img src="${ticket.fields.assignee.avatarUrls['24x24']}" />` : ''}
                ${ticket.fields.assignee ? ticket.fields.assignee.name : 'Unassigned'}
              </td>
            </tr>
            <tr>
              <td>Reporter:</td>
              <td>
                ${ticket.fields.reporter.avatarUrls ? `<img src="${ticket.fields.reporter.avatarUrls['24x24']}" />` : ''}
                ${ticket.fields.reporter.name}
              </td>
            </tr>
          </tbody>
        </table>
      </aside>
    </div>
  </main>
  <script type="text/javascript">
    var vscode = acquireVsCodeApi();

    document.body.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      vscode.postMessage({
        command: 'jira-plugin.openIssueCommand',
        title: 'View issue',
        arguments: [e.target.getAttribute('href')]
      }); 
    }, true);
  </script>
</body>
</html>`;