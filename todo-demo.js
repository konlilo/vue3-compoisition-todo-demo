const { createApp, ref, computed, onMounted, watch } = Vue;

const STORAGE_KEY = "todos-vuejs-3.0";
const todoStorage = {
  fetch() {
    const todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    todos.forEach(function (todo, index) {
      todo.id = index;
    });
    todoStorage.uid = todos.length;
    return todos;
  },
  save(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  },
  uid: 0,
};

// visibility filters
const filters = {
  all: (todos) => todos,
  active: (todos) => todos.filter((todo) => !todo.completed),
  completed: (todos) => todos.filter((todo) => todo.completed),
};

// app Vue instance
const app = createApp({
  setup() {
    // *** 顯示方法 ***

    const todos = ref([]); //清單項目
    const visibility = ref("all"); // 顯示
    const filteredTodos = computed(() =>
      filters[visibility.value](todos.value)
    ); //監聽 all,active,completed 分頁
    const remaining = computed(() => filters.active(todos.value).length); //未完成項目
    const pluralize = (n) => (n === 1 ? "item" : "items"); //字串顯示

    // *** 新增 ***

    const newTodo = ref("");
    const addTodo = () => {
      // 判斷是否有輸入，包含過濾前後空白
      const value = newTodo.value && newTodo.value.trim();
      if (!value) {
        return;
      }
      todos.value.push({
        id: todoStorage.uid++,
        title: value,
        completed: false,
      });
      newTodo.value = "";
    };
    // ***刪除***

    const removeTodo = (todo) => {
      todos.value.splice(todos.value.indexOf(todo), 1);
    };

    // ***獨立邏輯(編輯及取消***

    const editedTodo = ref(null);
    let beforeEditCache = null;
    const editTodo = (todo) => {
      beforeEditCache = todo.title;
      editedTodo.value = todo;
    };

    const doneEdit = (todo) => {
      // 如果修改 沒有值
      if (!editedTodo.value) {
        return;
      }
      editedTodo.value = null; //初始化

      todo.title = todo.title.trim();

      // 如果 編輯項目沒有輸入
      if (!todo.title) {
        removeTodo(todo);
      }
    };

    // 取消編輯
    const cancelEdit = (todo) => {
      editedTodo.value = null;
      todo.title = beforeEditCache;
    };

    //狀態調整，清除所有完成項目
    const removeCompleted = () => {
      todos.value = filters.active(todos.value);
    };

    const allDone = computed({
      get: () => remaining === 0, //顯示完成項目為0
      set: (value) => todos.value.forEach((todo) => (todo.completed = value)),
    });

    //LocalStorage 操作
    onMounted(() => (todos.value = todoStorage.fetch()));
    watch(
      todos,
      () => {
        todoStorage.save(todos.value);
      },
      { deep: true }
    );

    return {
      // data
      todos,
      visibility,
      newTodo,
      editedTodo,

      // computed
      filteredTodos,
      remaining,
      allDone,

      // methods
      pluralize,
      addTodo,
      removeTodo,
      editTodo,
      doneEdit,
      cancelEdit,
      removeCompleted,
    };
  },

  directives: {
    "todo-focus": {
      updated(el, binding) {
        if (binding.value) {
          el.focus();
        }
      },
    },
  },
});

// mount
app.mount(".todoapp");
