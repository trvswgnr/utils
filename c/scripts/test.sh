#!/usr/bin/env bash

find_tests_folder_from_cwd() {
    local dir=$1
    if [ -d "$dir/src/tests" ]; then
        echo "$dir/src/tests"
    else
        cd ..
        dir=$(pwd)
        find_tests_folder_from_cwd $dir
    fi
}

run_test() {
    file=$1
    tests_folder=$(find_tests_folder_from_cwd $(pwd))
    gcc $tests_folder/$file -o _internal_test
    ret=0
    ./_internal_test
    ret=$?
    rm _internal_test
    return $ret
}

# if a filename is passed, run only that file
if [ $# -eq 1 ]; then
    run_test $1.c
    exit
fi

# get all files in the tests directory
files=$(ls src/tests)

any_fails=false
# run each file
for file in $files; do
    run_test $file
    if [ $? -eq 1 ]; then
        any_fails=true
    fi
done

if [ $any_fails == false ]; then
    echo "All tests passed"
else
    echo "Some tests failed"
fi