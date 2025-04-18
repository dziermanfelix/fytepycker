#!/bin/bash
set -e

versionf="VERSION.txt"

version=$(cat ${versionf})
IFS='.' read -r major minor patch <<< "$version"
patch=$((patch + 1))
new_version="${major}.${minor}.${patch}"
echo "$new_version" > ${versionf}

echo
echo "~~~ Building Fytepycker v$new_version ~~~"
echo

cd frontend
npm install
npm run build
cd ..

python manage.py collectstatic --noinput

git add .

if ! git diff --cached --quiet; then
  git commit -m "Fytepycker Deployment v${new_version}"
  git push origin main
  git push heroku main
else
  echo "No changes to commit."
fi
