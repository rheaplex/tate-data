.PHONY: all clean

SCRIPTS = $(wildcard *.js)
TXTS = $(patsubst %.js,%.txt,$(SCRIPTS))

all: $(TXTS)

clean:
	rm -fv $(TXTS)

%.txt: %.js
	node $^ > $@
