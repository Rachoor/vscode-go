/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');
import { getBinPath } from './goPath';
import { promptForMissingTool } from './goInstallTools';
import { execContainer } from './goDocker';

// Keep in sync with https://github.com/lukehoban/go-outline
interface GoOutlineRange {
	start: number;
	end: number;
}

interface GoOutlineDeclaration {
	label: string;
	type: string;
	receiverType?: string;
	icon?: string; // icon class or null to use the default images based on the type
	start: number;
	end: number;
	children?: GoOutlineDeclaration[];
	signature?: GoOutlineRange;
	comment?: GoOutlineRange;
}

export function documentSymbols(filename: string): Promise<GoOutlineDeclaration[]> {
	return new Promise<GoOutlineDeclaration[]>((resolve, reject) => {

		execContainer('go-outline', ['-f', filename], {}, (err, stdout, stderr) => {
		// 	console.log(err, stdout, stderr);
		// });

		// let gooutline = getBinPath('go-outline');
		// // Spawn `go-outline` process
		// let p = cp.execFile(gooutline, ['-f', filename], {}, (err, stdout, stderr) => {
			try {
				if (err && (<any>err).code === 'ENOENT') {
					promptForMissingTool('go-outline');
				}
				if (err) return resolve(null);
				let result = stdout.toString();
				let decls = <GoOutlineDeclaration[]>JSON.parse(result);
				return resolve(decls);
			} catch (e) {
				reject(e);
			}
		});
	});
}

export class GoDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

	private goKindToCodeKind: { [key: string]: vscode.SymbolKind } = {
		'package': vscode.SymbolKind.Package,
		'import': vscode.SymbolKind.Namespace,
		'variable': vscode.SymbolKind.Variable,
		'type': vscode.SymbolKind.Interface,
		'function': vscode.SymbolKind.Function
	};

	private convertToCodeSymbols(document: vscode.TextDocument, decls: GoOutlineDeclaration[], symbols: vscode.SymbolInformation[], containerName: string): void {
		decls.forEach(decl => {
			let label = decl.label;
			if (decl.receiverType) {
				label = '(' + decl.receiverType + ').' + label;
			}
			let symbolInfo = new vscode.SymbolInformation(
				label,
				this.goKindToCodeKind[decl.type],
				new vscode.Range(document.positionAt(decl.start), document.positionAt(decl.end - 1)),
				undefined,
				containerName);
			symbols.push(symbolInfo);
			if (decl.children) {
				this.convertToCodeSymbols(document, decl.children, symbols, decl.label);
			}
		});
	}

	public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {

		return documentSymbols(document.fileName).then(decls => {
			let symbols: vscode.SymbolInformation[] = [];
			this.convertToCodeSymbols(document, decls, symbols, '');
			return symbols;
		});
	}
}
