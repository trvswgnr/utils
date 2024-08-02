#ifndef CTEST_H
#define CTEST_H

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#define ANSI_RED "\x1b[31m"
#define ANSI_GREEN "\x1b[32m"
#define ANSI_DIM "\x1b[2m"
#define ANSI_RESET "\x1b[0m"

#define MAX_TESTS 100
#define MAX_FILE_NAME 256

typedef struct
{
    const char *name;
    void (*func)(void);
    const char *file;
    int passed;
    double duration;
} Test;

Test tests[MAX_TESTS];
int test_count = 0;
int expect_count = 0;
const char *current_file = "";
Test *current_test = NULL;

typedef struct
{
    int pass_count;
    int fail_count;
    int expect_count;
    int file_count;
    double total_duration;
} Results;

#define TEST(name)                                      \
    void test_##name(void);                             \
    __attribute__((constructor)) void register_##name() \
    {                                                   \
        add_test(#name, test_##name, __FILE__);         \
    }                                                   \
    void test_##name(void)

#define EXPECT(condition) expect(condition, __FILE__, __LINE__)

void run_test(Test *test)
{
    current_test = test;
    clock_t start = clock();
    test->func();
    clock_t end = clock();
    test->duration = ((double)(end - start)) / CLOCKS_PER_SEC * 1000; // Convert to milliseconds
    current_test = NULL;
}

void add_test(const char *name, void (*func)(void), const char *file)
{
    if (test_count < MAX_TESTS)
    {
        tests[test_count].name = name;
        tests[test_count].func = func;
        tests[test_count].file = file;
        tests[test_count].passed = 1; // Assume passed until proven otherwise
        test_count++;
    }
}

void expect(int condition, const char *file, int line)
{
    expect_count++;
    if (!condition && current_test != NULL)
    {
        current_test->passed = 0;
        printf("  Failed assertion at %s:%d\n", file, line);
    }
}

int run_tests()
{
    int pass_count = 0;
    int fail_count = 0;
    int file_count = 0;
    const char *last_file = "";

    printf("Running tests...\n");

    for (int i = 0; i < test_count; i++)
    {
        if (strcmp(current_file, tests[i].file) != 0)
        {
            printf("\n%s:\n", tests[i].file);
            current_file = tests[i].file;
            file_count++;
        }

        run_test(&tests[i]);

        if (tests[i].passed)
        {
            printf(ANSI_GREEN "✓" ANSI_RESET " %s " ANSI_DIM "[%.3fms]" ANSI_RESET "\n", tests[i].name, tests[i].duration);
            pass_count++;
        }
        else
        {
            printf(ANSI_RED "✗" ANSI_RESET " %s " ANSI_DIM "[%.3fms]" ANSI_RESET "\n", tests[i].name, tests[i].duration);
            fail_count++;
        }
    }

    printf(ANSI_GREEN "\n %d pass" ANSI_RESET, pass_count);
    if (fail_count > 0)
    {
        printf(ANSI_RED "\n %d fail" ANSI_RESET, fail_count);
    }
    else
    {
        printf(ANSI_DIM "\n 0 fail" ANSI_RESET);
    }
    printf("\n %d expect() calls\n\n", expect_count);
    // printf("\nRan %d test%s across %d file%s.\n", test_count, test_count == 1
    // ? "" : "s", file_count, file_count == 1 ? "" : "s");
    
    if (fail_count > 0)
    {
        return 1;
    }

    return 0;

    // return (Results){
    //     .pass_count = pass_count,
    //     .fail_count = fail_count,
    //     .expect_count = expect_count,
    //     .file_count = file_count,
    //     .total_duration = 0,
    // };
}
#endif // CTEST_H