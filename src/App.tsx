import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import {generateClient} from "aws-amplify/data";
import {cli} from "aws-cdk/lib";

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

    useEffect(() => {
        client.models.Todo.observeQuery().subscribe({
            next: (data) => setTodos([...data.items]),
        });
    }, []);

    function createTodo() {
        client.models.Todo.create({content: window.prompt("Todo content"), isDone: false});
    }

    function deleteTodo(id: string) {
        client.models.Todo.delete({id})
    }

    function updateTodo(id: string, currentContent: string) {
        const updatedContent = window.prompt("Update Todo content", currentContent);
        if (updatedContent) {
            client.models.Todo.update({id, content: updatedContent});
        }
    }

    function updateTodoIsDone(id: string, currentIsDone: boolean) {
        client.models.Todo.update({id, isDone: !currentIsDone})
    }

    return (
        <main>
            <h1>My todos</h1>
            <button onClick={createTodo}>+ new</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}
                        style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>{todo.content}
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                            <button onClick={() => updateTodo(todo.id, todo.content || '')}>Update</button>
                            <input type="checkbox" checked={todo.isDone ? todo.isDone : false}
                                   onChange={() => updateTodoIsDone(todo.id, todo.isDone)}
                            />
                        </div>
                    </li>
                ))}
            </ul>
            <div>
                🥳 App successfully hosted. Try creating a new todo.
                <br/>
                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                    Review next step of this tutorial.
                </a>
            </div>
        </main>
    );
}

export default App;
