//
//  react_native_ali_oss.m
//  react-native-ali-oss
//
//  Created by Arthur on 16/5/17.
//  Copyright © 2016年 Arthur. All rights reserved.
//

#import "RCTAliyunOSS.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTDefines.h"
#import "OSSService.h"
#import <AssetsLibrary/AssetsLibrary.h>
#define _extract_item_(_items_,_key_) _items_[_key_] != nil?[NSString stringWithFormat:@"%@",_items_[_key_]]:@""

@implementation RCTAliyunOSS
@synthesize client;

RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(setUpClient:(NSDictionary*)items success:(RCTResponseSenderBlock)success error:(RCTResponseSenderBlock)error)
{

    NSString* accessKeyId = _extract_item_(items,@"accessKeyId");
    NSString* accessKeySecret = _extract_item_(items,@"accessKeySecret");
    NSString* securityToken =_extract_item_(items,@"securityToken");
    NSString* endpoint = _extract_item_(items,@"endpoint");


    id<OSSCredentialProvider> credential = [[OSSStsTokenCredentialProvider alloc] initWithAccessKeyId:accessKeyId secretKeyId:accessKeySecret securityToken:securityToken];

    self.client = [[OSSClient alloc] initWithEndpoint:endpoint credentialProvider:credential];

    if (self.client) {
        success(@[@{@"status":@{@"code":@(0),@"msg":@"成功"},@"para":items}]);
    }
    else{
        error(@[@{@"status":@{@"code":@(100),@"msg":@"token失效"},@"para":items}]);
    }

}

RCT_EXPORT_METHOD(putByParams:(NSDictionary*)items success:(RCTResponseSenderBlock)success error:(RCTResponseSenderBlock)error)
{
    OSSPutObjectRequest * put = [OSSPutObjectRequest new];
    NSString* bucketName = _extract_item_(items,@"bucket");
    NSString* objectKey  = _extract_item_(items,@"objectKey");
    NSString* filePath   = _extract_item_(items,@"uri");
    // 必填字段
    put.bucketName = bucketName;
    put.objectKey = objectKey;
    
    ALAssetsLibrary  *lib = [[ALAssetsLibrary alloc] init];
    [lib assetForURL:[NSURL URLWithString:filePath] resultBlock:^(ALAsset *asset){
         // 使用asset来获取本地图片
         ALAssetRepresentation *assetRep = [asset defaultRepresentation];
         CGImageRef imgRef = [assetRep fullResolutionImage];
         
        Byte *buffer = (Byte*)malloc(assetRep.size);
        NSUInteger buffered = [assetRep getBytes:buffer fromOffset:0.0 length:assetRep.size error:nil];
        NSData *data = [NSData dataWithBytesNoCopy:buffer length:buffered freeWhenDone:YES];//this is NSData may be what you want

        
        put.uploadingData = data;
        
        // 可选字段，可不设置
        put.uploadProgress = ^(int64_t bytesSent, int64_t totalByteSent, int64_t totalBytesExpectedToSend) {
            // 当前上传段长度、当前已经上传总长度、一共需要上传的总长度
            NSLog(@"%lld, %lld, %lld", bytesSent, totalByteSent, totalBytesExpectedToSend);
        };
        
        OSSTask * putTask = [self.client putObject:put];
        
        [putTask continueWithBlock:^id(OSSTask *task) {
            if (!task.error) {
                success(@[@{@"status":@{@"code":@(0),@"msg":@"上传成功"},@"para":items}]);
            } else {
                error(@[@{@"status":@{@"code":@(task.error.code),@"msg":task.error.localizedDescription},@"para":items}]);
            }
            return nil;
        }];

     }
        failureBlock:^(NSError *err){
        error(@[@{@"status":@{@"code":@(err.code),@"msg":err.localizedDescription},@"para":items}]);

     }
     ];
    
}

- (void)dealloc{
    NSLog(@"wait for dealloc");
}
@end
