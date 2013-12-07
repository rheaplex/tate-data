.PHONY: all clean

SCRIPTS = $(wildcard *.js)
CSVS = $(patsubst %.js,%.csv,$(SCRIPTS))

all: $(CSVS)

clean:
	rm -fv $(CSVS)

%.csv: %.js
	node $^ > $@
