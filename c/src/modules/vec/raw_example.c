#include "raw.h"

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

// Example struct to store in our RawVec
typedef struct
{
    int id;
    char name[50];
} Person;

void print_people(RawVec *vec, size_t len)
{
    Person *people = (Person *)RawVec_ptr(vec);
    for (size_t i = 0; i < len; i++)
    {
        printf("Person %zu: ID = %d, Name = %s\n", i, people[i].id, people[i].name);
    }
    printf("Capacity: %zu\n\n", RawVec_capacity(vec, sizeof(Person)));
}

#define print_type(x) _Generic((x), \
    int: "int", \
    float: "float", \
    double: "double", \
    char: "char", \
    default: "other")

int main()
{
    RawVec vec = RawVec_with_capacity(2, sizeof(Person), global_allocator);
    size_t len = 0;

    Person people[] = {
        {1, "Alice"},
        {2, "Bob"},
        {3, "Charlie"},
        {4, "David"}};

    for (size_t i = 0; i < 4; i++)
    {
        RawVec_reserve(&vec, len, 1, sizeof(Person));
        // if (err == RAWVEC_OK) {
        Person *ptr = (Person *)RawVec_ptr(&vec);
        ptr[len] = people[i];
        len++;
        printf("Added person: ID = %d, Name = %s\n", people[i].id, people[i].name);
        print_people(&vec, len);
        // } else {
        // fprintf(stderr, "Failed to reserve space\n");
        // exit(1);
        // }
    }

    printf("Shrinking to fit...\n");
    RawVec_shrink_to_fit(&vec, len, sizeof(Person));
    print_people(&vec, len);

    RawVec_drop(&vec);
    printf("RawVec dropped\n");

    print_type(vec);

    return 0;
}