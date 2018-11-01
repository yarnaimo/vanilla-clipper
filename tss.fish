#!/usr/bin/fish
# jq typesync

read -p 'echo "Project name » "' project_name
read -p 'echo "GitHub repository » "' -c yarnaimo/$project_name repository

git clone --depth=1 git@github.com:yarnaimo/tss.git $project_name
cd $project_name
rm tss.fish
rm -rf .git
git init
git remote add origin git@github.com:$repository.git
git fetch origin
git checkout master
git branch -u origin/master master
git merge

set package_json (cat package.json)
echo $package_json \
 | jq '.name = "@yarnaimo/'$project_name'" | .repository = "github:'$repository'"' \
 > package.json

yarn add config js-yaml
yarn add -D typescript ts-node tsconfig-paths jest ts-jest @types/node prettier lint-staged husky sort-package-json
typesync
yarn

node_modules/.bin/sort-package-json
