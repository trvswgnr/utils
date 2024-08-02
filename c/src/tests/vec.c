#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "../modules/vec.h"
#include "../modules/test.h"

// Test helper function to create an integer
int *create_int(int value)
{
    int *ptr = (int *)malloc(sizeof(int));
    *ptr = value;
    return ptr;
}

TEST(Vec_new)
{
    Vec vec = Vec_new();
    EXPECT(Vec_capacity(&vec) == 0);
    EXPECT(Vec_len(&vec) == 0);
    EXPECT(Vec_is_empty(&vec));
    Vec_drop(&vec);
    EXPECT(vec.buf.ptr == NULL);
}

TEST(Vec_with_capacity)
{
    size_t capacity = 10;
    Vec vec = Vec_with_capacity(capacity, sizeof(int));
    EXPECT(Vec_capacity(&vec) >= capacity);
    EXPECT(Vec_len(&vec) == 0);
    Vec_drop(&vec);
}

TEST(push_and_pop)
{
    Vec vec = Vec_new();
    int values[] = {1, 2, 3, 4, 5};
    for (size_t i = 0; i < 5; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }
    EXPECT(Vec_len(&vec) == 5);

    int popped;
    for (int i = 4; i >= 0; i--)
    {
        EXPECT(Vec_pop(&vec, &popped, sizeof(int)));
        EXPECT(popped == values[i]);
    }
    EXPECT(Vec_is_empty(&vec));
    EXPECT(!Vec_pop(&vec, &popped, sizeof(int)));

    Vec_drop(&vec);
}

TEST(get_and_set)
{
    Vec vec = Vec_new();
    int values[] = {10, 20, 30, 40, 50};
    for (size_t i = 0; i < 5; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }

    for (size_t i = 0; i < 5; i++)
    {
        int *value = (int *)Vec_get(&vec, i, sizeof(int));
        EXPECT(*value == values[i]);
    }

    int new_value = 100;
    Vec_set(&vec, 2, &new_value, sizeof(int));
    int *changed_value = (int *)Vec_get(&vec, 2, sizeof(int));
    EXPECT(*changed_value == new_value);

    Vec_drop(&vec);
}

TEST(clear_and_truncate)
{
    Vec vec = Vec_new();
    int values[] = {1, 2, 3, 4, 5};
    for (size_t i = 0; i < 5; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }

    Vec_clear(&vec);
    EXPECT(Vec_is_empty(&vec));
    EXPECT(Vec_capacity(&vec) >= 5);

    for (size_t i = 0; i < 5; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }

    Vec_truncate(&vec, 3);
    EXPECT(Vec_len(&vec) == 3);
    for (size_t i = 0; i < 3; i++)
    {
        int *value = (int *)Vec_get(&vec, i, sizeof(int));
        EXPECT(*value == values[i]);
    }

    Vec_drop(&vec);
}

TEST(Vec_resize)
{
    Vec vec = Vec_new();
    int values[] = {1, 2, 3};
    for (size_t i = 0; i < 3; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }

    int filler = 0;
    Vec_resize(&vec, 5, &filler, sizeof(int));
    EXPECT(Vec_len(&vec) == 5);
    for (size_t i = 3; i < 5; i++)
    {
        int *value = (int *)Vec_get(&vec, i, sizeof(int));
        EXPECT(*value == filler);
    }

    Vec_resize(&vec, 2, &filler, sizeof(int));
    EXPECT(Vec_len(&vec) == 2);

    Vec_drop(&vec);
}

TEST(Vec_as_slice)
{
    Vec vec = Vec_new();
    int values[] = {1, 2, 3, 4, 5};
    for (size_t i = 0; i < 5; i++)
    {
        Vec_push(&vec, &values[i], sizeof(int));
    }

    int *slice = (int *)Vec_as_slice(&vec);
    for (size_t i = 0; i < 5; i++)
    {
        EXPECT(slice[i] == values[i]);
    }

    int *mut_slice = (int *)Vec_as_mut_slice(&vec);
    mut_slice[2] = 100;
    int *changed_value = (int *)Vec_get(&vec, 2, sizeof(int));
    EXPECT(*changed_value == 100);

    Vec_drop(&vec);

    EXPECT(vec.buf.ptr == NULL);
}

int main()
{
    return run_tests();
}
