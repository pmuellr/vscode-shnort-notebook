import * as vscode from 'vscode';

interface RawNotebookCell {
	cellKind: vscode.CellKind;
	source: string;
	language: string;
	metadata: vscode.NotebookCellMetadata;
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
	vscode.notebook.registerNotebookContentProvider(
	  'shnort-notebook',
	  new ShnortProvider()
	)
  );
}

class ShnortProvider implements vscode.NotebookContentProvider {
  async openNotebook(
	uri: vscode.Uri, 
	_openContext: vscode.NotebookDocumentOpenContext
  ): Promise<vscode.NotebookData> {
	const languages = ALL_LANGUAGES;
	const metadata: vscode.NotebookDocumentMetadata = {
	  editable: true,
	  cellEditable: true,
	  cellHasExecutionOrder: false,
	  cellRunnable: false,
	  runnable: true
	};
	let content = Buffer.from(await vscode.workspace.fs.readFile(uri))
	  .toString('utf8').trim();
	if (content === '') { content = '[]'; }

	const cellRawData = JSON.parse(content);
	const cells = cellRawData.map(rawToNotebookCellData);

	return { languages, metadata, cells };
  }

  async saveNotebook(
	document: vscode.NotebookDocument,
	cancellation: vscode.CancellationToken
  ): Promise<void> {
	const cellRawData = document.cells.map(notebookCellToRaw);
	const content = JSON.stringify(cellRawData, null, 4);
	await vscode.workspace.fs.writeFile(document.uri, Buffer.from(content));
  }

  async saveNotebookAs(
	targetResource: vscode.Uri,
	document: vscode.NotebookDocument,
	cancellation: vscode.CancellationToken
  ): Promise<void> {
	const cellRawData = document.cells.map(notebookCellToRaw);
	const content = JSON.stringify(cellRawData, null, 4);
	await vscode.workspace.fs.writeFile(targetResource, Buffer.from(content));
  }

  private _onDidChangeNotebook = new vscode.EventEmitter<vscode.NotebookDocumentEditEvent>();
  readonly onDidChangeNotebook = this._onDidChangeNotebook.event;
}

function rawToNotebookCellData(
  data: RawNotebookCell
): vscode.NotebookCellData {
  return {
	cellKind: data.cellKind,
	language: data.language,
	metadata: data.metadata,
	outputs: [],
	source: data.source
  };
}

export function notebookCellToRaw(
  cell: vscode.NotebookCell
): RawNotebookCell {
  return {
	cellKind: cell.cellKind,
	language: cell.language,
	metadata: cell.metadata,
	source: cell.document.getText()
  };
}

export function deactivate() { }

const ALL_LANGUAGES = [
	'javascript',
	'html',
];