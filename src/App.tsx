import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import {generateClient} from "aws-amplify/data";
import {Authenticator} from "@aws-amplify/ui-react";
import '@aws-amplify/ui-react/styles.css';

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
    const [tags, setTags] = useState<Array<Schema["Tag"]["type"]>>([]);
    const [displayForm, setDisplayForm] = useState<boolean>(false);
    const [sayHelloResponse, setSayHelloResponse] = useState<string | null>(null);
    const [todosWithTags, setTodosWithTags] = useState<any[]>([]);

    console.log("todos ", todos)
    console.log("tags ", tags)
    console.log("todosWithTags ", todosWithTags)

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

    useEffect(() => {
        async function fetchTodosWithTags() {
            const todosWithTagsData = await Promise.all(todos.map(async (todo) => {
                const todoTags = await client.models.TodoTag.list({filter: {todoId: {eq: todo.id}}});
                const tagsId = todoTags.data.map((todoTag) => todoTag.tagId);

                // Récupération des noms des tags associés
                const tagsNames = await Promise.all(tagsId.map(async (id) => {
                    const tag = await client.models.Tag.get({id: id});
                    return tag.data?.name; // Récupération du nom du tag
                }));

                return {...todo, tagsNames};
            }));

            setTodosWithTags(todosWithTagsData);
        }

        fetchTodosWithTags();
    }, [todos]);


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
        client.models.TodoTag.list({
            filter: {todoId: {eq: id}}
        }).then(({data}) => {
            const todoTagDeletions = data.map((todoTag) => {
                return client.models.TodoTag.delete({id: todoTag.id});
            });
            Promise.all(todoTagDeletions).then(() => {
                client.models.Todo.delete({id});
            }).catch((error) => {
                console.error("Erreur lors de la suppression des relations TodoTag :", error);
            });
        }).catch((error) => {
            console.error("Erreur lors de la récupération des relations TodoTag :", error);
        });
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

    function createTag() {
        client.models.Tag.create({name: window.prompt("Tag name")});
    }

    useEffect(() => {
        async function fetchSayHello() {
            const response = await client.queries.sayHello({name: "Grischka"});
            setSayHelloResponse(response.data);
        }

        fetchSayHello();
    }, []);


    return (
        <Authenticator        >
            {({signOut, user}) => {
                console.log(user);
                return(
                <main>
                    <div>Hello {user?.username}</div>
                    <button onClick={signOut}>Sign out</button>
                    <h1>My todos</h1>
                    <button onClick={() => setDisplayForm(true)}>+ new todo</button>
                    <ul>
                        {todosWithTags.map((todo) => (
                            <li key={todo.id}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}>
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
                                </div>
                                <div style={{display: 'flex', gap: '4px'}}>{todo.tagsNames.map((tag: string) => (
                                    <span style={{
                                        color: '#e43d3d',
                                        border: '2px solid #e43d3d',
                                        padding: '2px 4px',
                                        borderRadius: '8px'
                                    }}>
                                {tag}
                            </span>))}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <h2>My tags</h2>
                    <button onClick={createTag}>+ new tag</button>
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
                        <div>{sayHelloResponse}</div>
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
                                    padding: '24px',
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
                                        fontSize: '12px'
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
                                                <input type="text" id="content" name="content"
                                                       placeholder={'Enter todo content'}
                                                       required/>
                                            </label>
                                        </div>
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}>
                                                <h4>Select tag : </h4>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '12px'
                                                }}>
                                                    {tags.map((tag) => (
                                                        <div key={tag.id}>
                                                            <input
                                                                type="checkbox"
                                                                id={tag.id}
                                                                name="tags"
                                                                value={tag.id}
                                                            />
                                                            <label htmlFor={tag.id}>{tag.name}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button type={"submit"}>Create</button>
                                    </form>
                                </div>

                            </div>
                        )
                    }
                </main>)
            }}
        </Authenticator>
    );
}

export default App;
