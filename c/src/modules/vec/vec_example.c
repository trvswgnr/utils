#include <stdio.h>
#include <stdlib.h>
#include <assert.h>

// Include the Vec and RawVec implementations here
// #include "rawvec.h"
#include "./mod.h"

// For this example, we'll use a simple allocator that uses malloc/free
void *malloc_wrapper(size_t size)
{
    return malloc(size);
}

void free_wrapper(void *ptr)
{
    free(ptr);
}

void *realloc_wrapper(void *ptr, size_t old_size, size_t new_size)
{
    (void)old_size; // Unused parameter
    return realloc(ptr, new_size);
}

Allocator global_allocator = {
    .allocate = malloc_wrapper,
    .deallocate = free_wrapper,
    .reallocate = realloc_wrapper};

void print_vec(Vec *vec)
{
    printf("Vec (len: %zu, capacity: %zu): [", Vec_len(vec), Vec_capacity(vec, sizeof(int)));
    for (size_t i = 0; i < Vec_len(vec); i++)
    {
        int *value = Vec_get(vec, i, sizeof(int));
        printf("%d", *value);
        if (i < Vec_len(vec) - 1)
        {
            printf(", ");
        }
    }
    printf("]\n");
}

#define print_type(x) _Generic((x), \
    int: "int",                     \
    float: "float",                 \
    double: "double",               \
    char: "char",                   \
    Vec: "Vec",                     \
    default: "other")

int main()
{
    // Create a new Vec
    Vec vec = Vec_new(global_allocator);
    printf("Created a new Vec\n");
    print_vec(&vec);

    // Push some elements
    for (int i = 0; i < 5; i++)
    {
        Vec_push(&vec, &i, sizeof(int));
        printf("Pushed %d\n", i);
        print_vec(&vec);
    }

    // Pop an element
    int popped;
    bool success = Vec_pop(&vec, &popped, sizeof(int));
    if (success)
    {
        printf("Popped: %d\n", popped);
    }
    print_vec(&vec);

    // Get and modify an element
    int *second_element = Vec_get(&vec, 1, sizeof(int));
    *second_element = 10;
    printf("Modified second element\n");
    print_vec(&vec);

    // Reserve capacity
    Vec_reserve(&vec, 10, sizeof(int));
    printf("Reserved capacity for 10 more elements\n");
    print_vec(&vec);

    // Resize
    int fill_value = 42;
    Vec_resize(&vec, 8, &fill_value, sizeof(int));
    printf("Resized to 8 elements\n");
    print_vec(&vec);

    // Clear
    Vec_clear(&vec);
    printf("Cleared the Vec\n");
    print_vec(&vec);

    // Drop the Vec
    Vec_drop(&vec);
    printf("Dropped the Vec\n");

    printf("Vec is %s\n", print_type(vec));

    return 0;
}