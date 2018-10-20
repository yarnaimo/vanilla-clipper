module.exports = {
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupTestFrameworkScriptFile: './jest.setup.js',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    testRegex: '((\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleNameMapper: {
        '^~/(.+)': '<rootDir>/src/$1',
    },
}
