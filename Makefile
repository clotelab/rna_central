test:
	./node_modules/.bin/mocha -r jscoverage --covout=html -R spec "test/**/test*.js"

.PHONY: test