.PHONY: all watch test lint

all: lint test
  
watch:
	./node_modules/.bin/mocha -w -R list "test/**/test*.js"

test:
	./node_modules/.bin/mocha -r jscoverage --covout=html -R spec "test/**/test*.js"
  
lint:
	find . -not \( -path ./node_modules -prune \) -not \( -path ./covreporter -prune \) -name *.js -exec ./node_modules/.bin/jshint {} \;
  