import { Tree, Rule, SchematicContext } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {addPackageJsonDependency, NodeDependency, NodeDependencyType, removePackageJsonDependency} from '@schematics/angular/utility/dependencies';
import { colors } from '@angular-devkit/core/src/terminal';
import { Project, SyntaxKind } from 'ts-morph';
const fs = require('fs');
const glob = require('glob');

export const NODE_MODULES = './node_modules';

export const OB_VERSION = {
	'version-5': {
		'LATEST': '5.0.0-alpha.4',
		'5_0_1': '5.0.1'
	},
	'version-6': {
		'LATEST': '6.0.0-alpha'
	}
};
export const OB_LATEST = OB_VERSION['version-6'].LATEST;
export const OB_LAST_MAJOR_SUPPORT_VERSION = 4;
export const OB_PACKAGE = '@oblique/oblique';
export const OB_PACKAGE_JSON = NODE_MODULES + '/' + OB_PACKAGE + '/package.json';
export const OB_TESTING_MODULE = NODE_MODULES + '/' + OB_PACKAGE + '/lib/oblique-testing.module.d.ts';

export const PROJECT_ROOT_DIR = './';
export const PROJECT_SRC_DIR = './src';
export const PROJECT_APP_MODULE = PROJECT_SRC_DIR + '/app.module.ts';
export const PROJECT_ROUTING_MODULE = PROJECT_SRC_DIR + '/app/app-routing.module.ts';
export const PROJECT_ANGULAR_JSON = './angular.json';
export const PROJECT_PACKAGE_JSON = './package.json';

export class SchematicsUtil {

	static instance: SchematicsUtil;

	private readonly customImplentations: string[] = [];
	private readonly forceObliqueImplentations: string[] = [
		'TranslatePipe',
		'TranslateService',
		'TranslateParamsPipe',
		'MockTranslatePipe',
		'MockTranslateService',
		'MockTranslateParamsPipe'
	];

	static getInstance(): SchematicsUtil {
		if ( !SchematicsUtil.instance ) {
			SchematicsUtil.instance = new SchematicsUtil();
		}
		return SchematicsUtil.instance;
	}
	getCurrentObliqueVersion(tree: Tree) {
		const projectPackageJSON = JSON.parse(this.getFile(tree, PROJECT_PACKAGE_JSON));
		if ( !projectPackageJSON['dependencies'].hasOwnProperty(OB_PACKAGE) ) {
			throw new Error(`[ERROR] no installation found, abort migration`);
		}
		return projectPackageJSON['dependencies'][OB_PACKAGE];
	}

	getFile(tree: Tree, path: string) {
		const content = tree.read(path);
		if ( !content ) {
			throw new Error(`[ERROR] unable to read '${path}, abort migration'`);
		}
		return content.toString('utf-8');
	}

	installDependencies(): Rule {
		return (tree: Tree, _context: SchematicContext) => {
			_context.addTask(new NodePackageInstallTask());
			_context.logger.debug('Dependencies installed');
			return tree;
		};
	}

	updatePackageJSONDependency(name: string, version: string): Rule {
		return (tree: Tree, _context: SchematicContext) => {
			removePackageJsonDependency(tree, name);
			const nodeDependency: NodeDependency = {
				type: NodeDependencyType.Default,
				name: name,
				version: version,
				overwrite: true
			};
			addPackageJsonDependency(tree, nodeDependency);
			_context.logger.info(colors.blue(`- ${name}@${version}`) + colors.green(` ✔`));
			return tree;
		};
	}

	applyInTree(root: string, toApply: Function, extension = '.ts'): Rule {
		return (tree: Tree, _context: SchematicContext) => {
			const files = glob.sync(`${root}/**/*${extension}`, {});
			files.forEach((file: string) => toApply(file));
			return tree;
		};
	}

	getJSONProperty(property: string, serializedJSON: string): string {
		const regex = new RegExp(`"${property}":"((\\w)|(\\/)|(\\.))*"{1}`);
		const result = serializedJSON.replace(/\s/g, '').match(regex);
		if ( !result || !result[0] ) {
			throw new Error(`[ERROR] unable to get ${property}, abort migration`);
		}
		return result[0].replace(property, '').replace(/"/g, '').replace(':', '');
	}

	replaceInFile(tree: Tree, path: string, pattern: RegExp, replacement: string): boolean {
		const fileContent = this.getFile(tree, path);
		if ( pattern.test(fileContent) ) {
			tree.overwrite(path, fileContent.replace(pattern, replacement));
			return true;
		}
		return false;
	}

	extractFromBrackets(bracketType: '()' | '[]' | '{}', content: string): string {
		const boundaryLeft = bracketType.substr(0, 1);
		let extracted = '';
		let deepness = 0;
		let finished = false;
		content.split('').map((char: string) => {
			if ( finished ) {
				return;
			}
			if ( bracketType.indexOf(char) !== -1 ) {
				deepness += ( char === boundaryLeft ) ? 1 : -1 ;
				finished = ( deepness === 0 );
			}
			extracted += ( deepness > 0 ) ? char : '';
		});
		extracted = extracted.substr(1);
		return extracted;
	}

	extractProjections(tag: string, content: string): string[] {
		return content.split(`</${tag}>`)
		.map(leading => leading.split(`<${tag}`)[1])
		.filter(inner => !!inner)
		.reduce((extracted, inner) => [...extracted, this.extractInnerFragment(inner)], []);
	}

	addToList(list: string, toAdd: string, spacer = ' ', uniqueEntries = true): string {
		const entries = list.split(',').map(s => s.trim());
		if ( entries.includes(toAdd) && uniqueEntries ) {
			return entries.join(`,${spacer}`);
		}
		if ( entries.length === 1 && entries[0] === '' ) {
			// empty list
			return toAdd;
		}
		entries.push(toAdd);
		return entries.join(`,${spacer}`);
	}

	removeFromList(list: string, toRemove: string, spacer = ' '): string {
		const removed: any[] = [];
		list.split(',').map((entry) => {
			if ( entry.trim() !== toRemove ) {
				removed.push(entry.trim());
			}
		});
		return removed.join(`,${spacer}`);
	}

	/* TS MORPH UTILS */

	getProject(): Project {
		return new Project({useInMemoryFileSystem: true});
	}

	hasImport(tree: Tree, filePath: string, newSymbol: string, packageName: string): boolean {
		const sourceFile = this.getProject().createSourceFile(filePath, this.getFile(tree, filePath));
		let found = false;
		sourceFile.getImportDeclarations().forEach((importDeclaration) => {
			if ( !found && importDeclaration.getModuleSpecifierValue() === packageName ) {
				found = this.extractFromBrackets('{}', importDeclaration.getText()).split(',').map((symbol: string) => symbol.trim()).includes(newSymbol);
			}
		});
		return found;
	}

	updateImport(tree: Tree, filePath: string, newSymbol: string, packageName: string): void {
		const sourceFile = this.getProject().createSourceFile(filePath, this.getFile(tree, filePath));
		const content = sourceFile.getFullText();
		sourceFile.getImportDeclarations().forEach((importDeclaration) => {
			if ( importDeclaration.getModuleSpecifierValue() === packageName ) {
				const oldContent = this.extractFromBrackets('{}', importDeclaration.getText());
				const newContent = this.addToList(oldContent, newSymbol);
				tree.overwrite(filePath, content.replace(oldContent, newContent));
			}
		});
	}

	addImport(tree: Tree, filePath: string, symbol: string, packageName: string): void {
		if ( !this.hasImport(tree, filePath, symbol, packageName) ) {
			const fileContent = this.getFile(tree, filePath);
			const newImports = `import {${symbol}} from '${packageName}';\n`;
			tree.overwrite(filePath, newImports + fileContent);
		} else {
			this.updateImport(tree, filePath, symbol, packageName);
		}
	}

	removeImport(tree: Tree, filePath: string, symbol: string): void {
		const sourceFile = this.getProject().createSourceFile(filePath, this.getFile(tree, filePath));
		const content = sourceFile.getFullText();
		const array = sourceFile.getChildrenOfKind(SyntaxKind.ImportDeclaration);
		if ( array ) {
			array.forEach((child) => {
				const imports = this.extractFromBrackets('{}', child.getText());
				if ( imports.split(',').map((fragment: string) => fragment.trim()).includes(symbol) ) {
					const newImports = this.removeFromList(imports, symbol);

					tree.overwrite(filePath, content.replace(child.getText(), child.getText().replace(imports, newImports)));
				}
			});
		}
	}

	addToConstructor(tree: Tree, filePath: string, toInject: string): void {
		const sourceFile = this.getProject().createSourceFile(filePath, this.getFile(tree, filePath));
		const content = sourceFile.getFullText();
		sourceFile.getClasses().forEach((classDeclaration) => {
			classDeclaration.getConstructors().forEach((constructorDeclaration) => {
				const oldConstructor = constructorDeclaration.getText();
				const params = this.extractFromBrackets('()', oldConstructor);
				const body = this.extractFromBrackets('{}', oldConstructor);

				const newParams = this.addToList(params, toInject);
				const newConstructor = `\tconstructor(${newParams}) {${body}}`;

				tree.overwrite(filePath, content.replace(oldConstructor, newConstructor));
			});
		});
	}

	addToTestBedConfig(tree: Tree, filePath: string, symbol: string, property: 'providers' | 'declarations' | 'schemas' | 'imports'): void {

		const call: IConfigureTestingModuleCall = this.getConfigurationCall(tree, filePath, property);
		if ( !call.needsMigration ) {
			// nothing to do
			return;
		}

		const isEmptyConfig = this.extractFromBrackets('()', call.oldContent).replace(/\s/g, '') === '{}';

		if ( call.oldProperties ) {
			// append property
			const newProperties = this.addToList(call.oldProperties, symbol);
			const newContent = call.oldContent.replace(call.oldProperties, newProperties);
			tree.overwrite(filePath, call.content.replace(call.oldContent, newContent));
		} else if ( call.isEmptyOptions ) {
			// TODO write proper replacement
			const regex = new RegExp(`('|")?${property}('|")?(\\s)*:(\\s)*\\[(\\s)*\\]{1}`);
			this.replaceInFile(tree, filePath, regex, `${property}: [${symbol}]`);
		} else {
			// no existing property array
			const newProperties = `\t\t\t${property}: [${this.addToList('', symbol)}]`;
			const newOptions = `\n\t\t\t${call.oldOptions.trim()}${((call.oldOptions.length > 1) ? ',' : '')}\n${newProperties}`;
			let newContent = call.oldContent.replace(call.oldOptions, newOptions);
			if ( isEmptyConfig ) {
				newContent = call.oldContent.replace(this.extractFromBrackets('()', call.oldContent), `{${newOptions.trim()}}`);
			}
			tree.overwrite(filePath, call.content.replace(call.oldContent, newContent));
		}
	}

	removeFromTestBedConfig(tree: Tree, filePath: string, symbol: string, property: 'providers' | 'declarations' | 'schemas' | 'imports'): void {

		const call: IConfigureTestingModuleCall = this.getConfigurationCall(tree, filePath, property);
		if ( !call.needsMigration ) {
			// nothing to do
			return;
		}

		if ( call.oldProperties ) {
			// remove property
			const newProperties = this.removeFromList(call.oldProperties, symbol);
			const newContent = call.oldContent.replace(call.oldProperties, newProperties);
			tree.overwrite(filePath, call.content.replace(call.oldContent, newContent));
		}
	}

	removeImplicitDeclarations(tree: Tree, filePath: string, property: 'providers' | 'declarations' | 'schemas' | 'imports'): void {

		const call: IConfigureTestingModuleCall = this.getConfigurationCall(tree, filePath, property);
		if ( !call.needsMigration ) {
			// nothing to do
			return;
		}

		const codeSnippet = this.getProject().createSourceFile(`${Math.random()}.ts`, `[${call.oldProperties}]`);
		const array = codeSnippet.getFirstChildByKind(SyntaxKind.ExpressionStatement);
		const newProperties: string[] = [];
		if ( array ) {
			array.getExpression().forEachChild((child) => {
				const literalSymbol = this.getLiteralSymbol(child);
				if ( literalSymbol ) {
					newProperties.push(literalSymbol);
				}
			});
		}
		const newContent = call.oldContent.replace(call.oldProperties, newProperties.join(', '));
		tree.overwrite(filePath, call.content.replace(call.oldContent, newContent));
	}

	loadBusinessSymbols(tree: Tree): void {
		const files = glob.sync(`**/*.ts`, { ignore: 'node_modules/**/*.ts' });
		files.forEach((file: string) => {
				const sourceFile = this.getProject().createSourceFile(file, this.getFile(tree, file));
				sourceFile.getChildrenOfKind(SyntaxKind.ClassDeclaration).forEach((classDeclaration: any) => {
					this.customImplentations.push(classDeclaration.getFirstChildByKind(SyntaxKind.Identifier).getText());
				});
		});
	}

	isObliqueSymbol(symbol: string): boolean {
		// always remove translation implementations
		if ( this.forceObliqueImplentations.includes(symbol) ) {
			return true;
		}

		if ( this.getObliqueModules().includes(symbol) ) {
			// check if it's a wrapper or a completely separate implementation
			const counterPart = ( symbol.indexOf('Mock') === -1 ) ? `Mock${symbol}` : symbol.replace('Mock', '') ;
			const hasCustomImplemntation = this.customImplentations.includes(symbol) || this.customImplentations.includes(counterPart);
			return !hasCustomImplemntation;
		}
		return false;
	}

	private extractInnerFragment(inner: string): string {
		return inner.split('>').map((fragment: string, index: number) => index > 0 ? fragment : '').join('>').substr(1);
	}

	private getLiteralSymbol(child: any): string | undefined {
		const literalSymbol = child.getText().trim();
		switch ( child.getKind() ) {
			case SyntaxKind.Identifier:
				if ( !this.isObliqueSymbol(literalSymbol) ) {
					// not implicit given through testing module
					return literalSymbol;
				}
				break;
			case SyntaxKind.ObjectLiteralExpression:
				const results: any[] = [];
				let assignments: string[] = [];
				this.walk(child, 'useClass', results);
				if ( results.length > 0 ) {
					child.getChildrenOfKind(SyntaxKind.PropertyAssignment).forEach((propertyAssignment: any) => {
						assignments = assignments.concat(propertyAssignment.getChildrenOfKind(SyntaxKind.Identifier).map((identifier: any) => identifier.getText().trim()));
					});
					const amount = assignments.reduce((occurences, className) => occurences + ( this.isObliqueSymbol(className) ? 1 : 0 ), 0);
					if ( amount === 0 ) {
						// not implicit given through testing module
						return literalSymbol;
					}
				} else {
					return literalSymbol;
				}
				break;
		}
	}

	private walk(node: any, identifier: string, results: any[]): void {
		if ( node.getText() === identifier ) {
			results.push(node);
		}
		node.getChildren().map((child: any) => {
			this.walk(child, identifier, results);
		});
	}

	private getObliqueModules(): string[] {
		if (!fs.existsSync(OB_TESTING_MODULE)) {
			throw new Error(`[ERROR] no testing module found, abort migration`);
		}
		const moduleContent = fs.readFileSync(OB_TESTING_MODULE, 'utf8');
		let exported: string[] = [];
		moduleContent.split(';').forEach((line: string) => {
			exported = exported.concat(this.extractFromBrackets('{}', line).split(',').map(symbol => symbol.trim()).filter((symbol: string) => symbol.length > 0));
		});
		exported = exported.concat(exported.map((symbol: string) => symbol.replace('Mock', '')));
		exported = exported.concat(this.forceObliqueImplentations);
		return exported;
	}

	private getConfigurationCall(tree: Tree, filePath: string, property: string): IConfigureTestingModuleCall {
		const sourceFile = this.getProject().createSourceFile(filePath, this.getFile(tree, filePath));
		const content = sourceFile.getFullText();
		const configurationCalls: any[] = [];
		this.walk(sourceFile, 'configureTestingModule', configurationCalls);

		if ( configurationCalls.length === 0 ) {
			return { needsMigration: false } as IConfigureTestingModuleCall;
		}

		const start = configurationCalls[0].getStart();
		const oldContent = content.substr(start);
		const oldOptions = this.extractFromBrackets('{}', content.substr(start));
		const oldProperties = this.extractFromBrackets('[]', oldOptions.substr(oldOptions.indexOf(property)));
		const oldOptionsBoundary = `[${oldProperties}]`.replace(/\s/g, '');

		return {
			content: content,
			oldContent: oldContent,
			oldProperties: oldProperties,
			oldOptions: oldOptions,
			isEmptyOptions: (oldContent.indexOf(property) !== -1 && oldOptionsBoundary === '[]'),
			needsMigration: true
		};
	}


}

interface IConfigureTestingModuleCall {
	content: string;
	oldContent: string;
	oldProperties: string;
	oldOptions: string;
	isEmptyOptions: boolean;
	needsMigration: boolean;
}

/*

importModule(moduleName: string, src: string, options: any) {
	return (tree: Tree, _context: SchematicContext) => {

		const workspace = getWorkspace(tree);
		const project = getProjectFromWorkspace(workspace, options.defaultProject);

		if (hasNgModuleImport(tree, appModulePath, moduleName)) {
			return printModuleAlreadyImported(moduleName, _context);
		}
		addModuleImportToRootModule(tree, moduleName, src, project);
		_context.logger.info(
			green(
				'Imported' + moduleName + ' into root module'
			)
		);

		return tree;
	};
}

*/