// 使用预加载脚本暴露的electronAPI替代直接require
const { electronAPI } = window;

document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    // 加载所有待办事项
    loadTodos();

    // 表单提交事件
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();

        if (title) {
            try {
                // 使用electronAPI.invoke替代ipcRenderer.invoke
                const id = await electronAPI.invoke('add-todo', title);
                const newTodo = { id, title, completed: false };
                addTodoToDOM(newTodo);
                todoInput.value = '';
            } catch (error) {
                console.error('Error adding todo:', error);
            }
        }
    });

    // 待办事项列表点击事件委托
    todoList.addEventListener('click', async (e) => {
        const target = e.target;
        const todoItem = target.closest('.todo-item');

        if (!todoItem) return;

        const id = parseInt(todoItem.dataset.id);

        // 切换完成状态
        if (target.classList.contains('todo-checkbox')) {
            const completed = target.checked;
            const titleElement = todoItem.querySelector('.todo-title');

            try {
                await electronAPI.invoke('update-todo', id, titleElement.textContent, completed);
                titleElement.classList.toggle('line-through', completed);
            } catch (error) {
                console.error('Error updating todo:', error);
            }
        }

        // 删除待办事项
        if (target.classList.contains('delete-btn')) {
            try {
                await electronAPI.invoke('delete-todo', id);
                todoItem.remove();
            } catch (error) {
                console.error('Error deleting todo:', error);
            }
        }

        // 编辑待办事项
        if (target.classList.contains('edit-btn')) {
            const titleElement = todoItem.querySelector('.todo-title');
            const currentTitle = titleElement.textContent;

            // 创建编辑输入框
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.value = currentTitle;
            editInput.className = 'todo-title-edit';

            // 替换标题为输入框
            titleElement.parentNode.replaceChild(editInput, titleElement);
            editInput.focus();

            // 提交编辑
            const submitEdit = async () => {
                const newTitle = editInput.value.trim();
                if (newTitle && newTitle !== currentTitle) {
                    try {
                        await electronAPI.invoke('update-todo', id, newTitle, todoItem.querySelector('.todo-checkbox').checked);
                        titleElement.textContent = newTitle;
                    } catch (error) {
                        console.error('Error updating todo:', error);
                    }
                }
                // 替换回标题元素
                editInput.parentNode.replaceChild(titleElement, editInput);
            };

            // 监听失去焦点和回车键
            editInput.addEventListener('blur', submitEdit);
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    submitEdit();
                }
            });
        }
    });
});

// 加载所有待办事项
async function loadTodos() {
    try {
        // 使用electronAPI.invoke替代ipcRenderer.invoke
        const todos = await electronAPI.invoke('get-todos');
        todos.forEach(addTodoToDOM);
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

// 添加待办事项到DOM（保持不变）
function addTodoToDOM(todo) {
    const todoList = document.getElementById('todo-list');

    const todoItem = document.createElement('div');
    todoItem.className = 'todo-item flex items-center justify-between p-3 border-b';
    todoItem.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox mr-3';
    checkbox.checked = todo.completed;

    const title = document.createElement('span');
    title.className = 'todo-title flex-1';
    title.textContent = todo.title;

    if (todo.completed) {
        title.classList.add('line-through', 'text-gray-500');
    }

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn text-blue-500 hover:text-blue-700';
    editBtn.innerHTML = '<i class="fa fa-pencil"></i>';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn text-red-500 hover:text-red-700';
    deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    todoItem.appendChild(checkbox);
    todoItem.appendChild(title);
    todoItem.appendChild(actions);

    todoList.prepend(todoItem);
}
