import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import {generateClient} from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
    const [tags, setTags] = useState<Array<Schema["Tag"]["type"]>>([]);
    const [displayForm, setDisplayForm] = useState<boolean>(false);

    console.log("todos ", todos)
    console.log("tags ", tags)

    useEffect(() => {
        // A chaque changement dans les données on met à jour les todos
        const todoSub = client.models.Todo.observeQuery().subscribe({
            next: (data) => setTodos([...data.items]),
        });

        const tagSub = client.models.Tag.observeQuery().subscribe({
            next: (data) => setTags([...data.items]),
        });

        // On se désabonne de l'observation lorsque le composant est démonté pour éviter les effets de bord
        return () => {
            todoSub.unsubscribe();
            tagSub.unsubscribe()
        };

    }, []);

    function createTodo(formData: FormData) {
        const todoData = {
            content: formData.get('content')?.toString() || '',
            isDone: false
        };

        client.models.Todo.create(todoData).then((createdTodo) => {
            const todoId = createdTodo.data?.id;

            const selectedTags = formData.getAll('tags') as Array<string>;

            selectedTags.forEach((tagId) => {
                client.models.TodoTag.create({
                    todoId: todoId!,
                    tagId: tagId
                });
            });
        });
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        createTodo(formData);
        setDisplayForm(false);
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

    console.log(client.queries.sayHello({name:'Grischka'}))
    return (
        <main>
            <h1>My todos</h1>
            <button onClick={() => setDisplayForm(true)}>+ new</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}
                        style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <input type="checkbox" checked={todo.isDone ?? false}
                                   onChange={() => updateTodoIsDone(todo.id, !!todo.isDone)}
                            />
                            <span>{todo.content}</span>
                            {/*<span>{todo.tags.map((tag)=>tag.name)}</span>*/}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                            <button onClick={() => updateTodo(todo.id, todo.content || '')}>Update</button>
                        </div>
                    </li>
                ))}
            </ul>
            <h2>My tags</h2>
            <ul>
                {tags.map((tag) => (
                    <li key={tag.id}>
                        {tag.name}
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
            {
                displayForm && (
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                        width: "100wv",
                        height: "100vh",
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            padding: '12px',
                            borderRadius: '10px',
                            position: 'relative',
                        }}>
                            <button style={{
                                color: 'white',
                                borderRadius: '10px',
                                width: '20px',
                                height: '20px',
                                padding: '0',
                                position: "absolute",
                                top: '5px',
                                right: '5px',
                                fontSize:'12px'
                            }}
                                    onClick={() => setDisplayForm(false)}>X
                            </button>
                            <h3>Create todo</h3>
                            <form onSubmit={handleSubmit} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div>
                                    <label htmlFor="content">
                                        <input type="text" id="content" name="content" placeholder={'Enter todo content'}
                                               required/>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="tags" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        Select tag
                                        <select name="tags" id="tags" multiple>
                                            {tags.map((tag) => (
                                                <option key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <button type={"submit"}>Create</button>
                            </form>
                        </div>

                    </div>
                )
            }
        </main>
    );
}

export default App;
