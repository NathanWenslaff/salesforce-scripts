# salesforce-scripts

## Delete Apex Logs

```
npm run log:delete
```

This will delete all Apex logs in your default org.

## Enable/Disable Debug Mode

```
npm run debugMode:enable
```

This will query for users in your org that have debug mode disabled. Then it will prompt you to select which users you want to enable debug mode for.

```
npm run debugMode:disable
```

This will query for users in your org that have debug mode enabled. Then it will prompt you to select which users you want to disable debug mode for.

## Set Up Trace Flags

```
npm run debugSetup:save
```

1. It will query for all users in your org and ask which ones you want to trace.
2. It will query for all Apex classes in your org and ask which ones you want to igore
3. It will delete existing trace flags and set up new ones to trace the users you selected in step 1 and ignore the classes you selected in step 2.
4. It will save these choices

```
npm run debugSetup:default
```

This will automatically set up trace flags based on the answers you gave while running the prevous script (so you don't have to go through the prompts in steps 1 and 2)
