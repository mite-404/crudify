

`Crudify` uses the [errsole](https://www.errsole.com/) logger to capture uncaught errors and log them. This logger is designed to make your debugging process smoother and more efficient. By using the `CrudifyLoggerModule`, you can quickly track and resolve issues that arise in your application.

---

### **Import `CrudifyLoggerModule` in Your `AppModule`**

To enable logging for your application, you need to import the `CrudifyLoggerModule` in your `app.module.ts` file. Here’s how you can do it:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { CrudifySwaggerModule } from 'ncrudify';
import { CrudifyLoggerModule } from 'ncrudify'; // Import the logger module

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI), // Connect to your MongoDB instance
    UserModule, // Your feature module
    CrudifyLoggerModule.forRoot({ // Configure the logger module
      uri: process.env.MONGODB_URI, // MongoDB connection URI
      dbName: process.env.MONGODB_LOGDB, // Database name for storing logs
    }),
  ],
})
export class AppModule {}
```

---

### **Configuration Options**

The `CrudifyLoggerModule.forRoot()` method accepts a configuration object with the following properties:

- **`uri: string`**: The MongoDB connection URI where logs will be stored. Defaults to `mongodb://127.0.0.1:27017` .
- **`dbName: string`**: The name of the database where logs will be saved. Defaults to `logs`
- **`disabled?: boolean`**: (Optional) Disable or no the logger.
- **`options?: object`**: (Optional) Errsole options.

#### **Example: Custom Log Level and Port**
```typescript
CrudifyLoggerModule.forRoot({
  uri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_LOGDB,
  disabled: false,
  options?: {
	storage:  any;
	port?:  number;
	enableConsoleOutput?:  boolean;
	exitOnException?:  boolean;
	enableDashboard?:  boolean;
	path?:  string;
	appName?:  string;
	environmentName?:  string;
	serverName?:  string;
	collectLogs?:  string[];
  };
}),
```

---

### **How It Works**

Once configured, the `CrudifyLoggerModule` will:
1. **Capture Uncaught Errors**: Automatically log any uncaught exceptions or errors in your application.
2. **Store Logs in MongoDB**: Save the logs in the specified MongoDB database for easy access and review.
3. **Provide a Clear Interface**: Use the errsole interface to view and analyze logs in a structured way.

---

### **Accessing Logs**

By default, the logger listens on port `8001`. You can access the logs by navigating to:

```
http://127.0.0.1:8001
```

If you changed the port in the configuration, replace `8001` with your custom port.

---

### **Benefits of Using `CrudifyLoggerModule`**

1. **Centralized Logging**: All logs are stored in a single MongoDB database, making it easy to track and analyze issues.
2. **Error Tracking**: Uncaught errors are automatically logged, reducing the time spent debugging.
3. **Customizable**: Adjust the log level and port to suit your application’s needs.
4. **Integration with `Crudify`**: Works seamlessly with `Crudify`-generated APIs and other NestJS modules.

---

### **Key Takeaways**

1. **Import `CrudifyLoggerModule`**: Add the logger module to your `AppModule` to enable error logging.
2. **Configure MongoDB Connection**: Provide the MongoDB URI and database name for storing logs.
3. **Customize Log Level and Port**: Adjust the log level and port as needed.
4. **Access Logs**: View logs at `http://127.0.0.1:8001` (or your custom port).

By setting up the `CrudifyLoggerModule`, you can streamline your debugging process and ensure that all errors are logged and easily accessible. Let me know if you need further assistance! 🚀
